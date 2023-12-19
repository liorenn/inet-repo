import DevicePhotos from './DevicePhotos'
import { Card, Button, Grid, Text, Space } from '@mantine/core'
import type { DeviceType, devicePropertiesType } from '../../models/deviceTypes'
import Link from 'next/link'
import { useUser } from '@supabase/auth-helpers-react'
import useTranslation from 'next-translate/useTranslation'

type AppProps = {
  device: devicePropertiesType
  index: number
  isInList: boolean
  deviceType: DeviceType
  handleIsInlist: (
    device: devicePropertiesType,
    isInList: boolean,
    index: number
  ) => void
}

export default function DeviceCard({
  device,
  deviceType,
  isInList,
  index,
  handleIsInlist,
}: AppProps) {
  const user = useUser()
  const { t } = useTranslation('devices')

  return (
    <Card shadow='lg' p='lg' radius='md'>
      <Card.Section>
        <Space h='lg' />
        <DevicePhotos device={device} miniphotos={false} />
      </Card.Section>

      <Text
        weight={500}
        style={{ marginBottom: 10, fontSize: 30 }}
        align='center'>
        {device.name}
      </Text>

      <Grid sx={{ marginTop: 2 }}>
        <Grid.Col span={6}>
          <Link
            href={deviceType + '/' + device.model}
            style={{ textDecoration: 'none' }}>
            <Button
              variant='light'
              color='gray'
              radius='md'
              size='md'
              fullWidth>
              {t('moreDetails')}
            </Button>
          </Link>
        </Grid.Col>
        <Grid.Col span={6}>
          {user !== null ? (
            <Button
              variant='light'
              color={isInList ? 'red' : 'green'}
              radius='md'
              size='md'
              onClick={() => handleIsInlist(device, isInList, index)}
              fullWidth>
              {isInList ? t('remove') : t('add')}
            </Button>
          ) : (
            <Button
              variant='light'
              color={'gray'}
              radius='md'
              size='md'
              disabled
              fullWidth>
              {t('signInToAdd')}
            </Button>
          )}
        </Grid.Col>
      </Grid>
    </Card>
  )
}