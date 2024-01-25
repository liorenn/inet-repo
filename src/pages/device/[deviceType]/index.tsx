import { Container, SimpleGrid } from '@mantine/core'
import type { DeviceType, devicePropertiesType } from '@/models/enums'
import { useEffect, useState } from 'react'

import DeviceCard from '@/components/device/DeviceCard'
import DeviceHeader from '@/components/device/DeviceTypeHeader'
import Head from 'next/head'
import Loader from '@/components/layout/Loader'
import { trpc } from '@/utils/client'
import { usePostHog } from 'posthog-js/react'
import { useRouter } from 'next/router'
import { useUser } from '@supabase/auth-helpers-react'

type devicesType = {
  isInList?: boolean
} & devicePropertiesType

export default function Devices() {
  const router = useRouter()
  const posthog = usePostHog()
  const deviceType = router.asPath.split('/')[router.asPath.split('/').length - 1] as DeviceType
  const user = useUser() // Get the user object from Supabase
  const [devices, setDevices] = useState<devicesType[] | undefined>(undefined)
  const { data: devicesQuery } = trpc.device.getDevices.useQuery({
    deviceType: deviceType,
  })
  const { data: userDevicesQuery } = trpc.device.getUserDevicesFromUserTable.useQuery({
    email: user?.email,
  })
  const [captured, setCaptured] = useState(false)

  useEffect(() => {
    const userDevices = userDevicesQuery?.deviceList
    if (userDevices) {
      setDevices((prev) =>
        prev?.map((device) => {
          if (userDevices.find((userDevice) => userDevice.device.model === device.model)) {
            return { ...device, isInList: true }
          }
          return device
        })
      )
    }
  }, [userDevicesQuery?.deviceList])

  useEffect(() => {
    if (devicesQuery) {
      setDevices(devicesQuery)
    }
    if (!captured && devicesQuery) {
      posthog.capture('Device Type Page', {
        deviceType,
      })
      setCaptured(true)
    }
  }, [captured, deviceType, devicesQuery, posthog])

  if (!devices) return <Loader />

  if (devices && devices?.length > 0) {
    return (
      <>
        <Head>
          <title>{deviceType}</title>
        </Head>
        <Container size='lg'>
          <DeviceHeader deviceType={deviceType} />
          <SimpleGrid
            cols={3}
            breakpoints={[
              { maxWidth: 'sm', cols: 1 },
              { maxWidth: 'md', cols: 2 },
              { minWidth: 'lg', cols: 3 },
            ]}>
            {devices.map((value, index) => (
              <DeviceCard device={value} key={index} />
            ))}
          </SimpleGrid>
        </Container>
      </>
    )
  }
}
