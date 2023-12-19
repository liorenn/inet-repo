import { Card, Button, Image } from '@mantine/core'
import Link from 'next/link'

export default function DeviceTypeCard({
  devicesType,
}: {
  devicesType: string
}) {
  return (
    <Card key={devicesType}>
      <Card.Section>
        <Image
          src={'/images/devices/' + devicesType + '.png'}
          height={220}
          fit={'contain'}
          alt='device photo'
        />
      </Card.Section>
      <Link href={'/device/' + devicesType} style={{ textDecoration: 'none' }}>
        <Button variant='light' color='gray' fullWidth mt='md' radius='md'>
          {devicesType}
        </Button>
      </Link>
    </Card>
  )
}