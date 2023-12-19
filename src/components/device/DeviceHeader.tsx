import { useMantineColorScheme } from '@mantine/core'
import { Group, Breadcrumbs, Text, Title } from '@mantine/core'
import type { Device } from '@prisma/client'
import useTranslation from 'next-translate/useTranslation'
import Link from 'next/link'

export default function DeviceHeader({ device }: { device: Device }) {
  const { colorScheme } = useMantineColorScheme()
  const { t } = useTranslation('common')
  const { t: devicesT } = useTranslation('devices')
  const dark = colorScheme === 'dark'

  const links = [
    { name: t('allDevices'), href: '/device' },
    { name: device.type, href: `/device/${device.type}` },
    { name: device.name, href: '#' },
  ]

  return (
    <Group
      position='apart'
      sx={{
        marginTop: 50,
        marginBottom: 15,
        borderBottom: dark ? '1px solid #333333' : '1px solid #dee2e6',
      }}>
      <Breadcrumbs separator='>'>
        {links.map((item, index) => (
          <Link href={item.href} key={index} style={{ textDecoration: 'none' }}>
            <Text size='xl' color='dimmed'>
              {item.name}
            </Text>
          </Link>
        ))}
      </Breadcrumbs>
      <Title order={2}>{`${device.name} ${devicesT('specs')}`}</Title>
    </Group>
  )
}