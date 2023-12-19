import { Button, Container, useMantineColorScheme } from '@mantine/core'
import { Accordion } from '@mantine/core'
import useTranslation from 'next-translate/useTranslation'
import { FortmatSpecs, type deviceSpecsType } from '../../models/SpecsFormatter'
import { useState } from 'react'
import Link from 'next/link'
import DeviceTable from './DeviceTable'

export type categoriesType = {
  name: string
  values: {
    label: string
    info: string
  }[]
}[]

export default function DeviceSpecs({ device }: { device: deviceSpecsType }) {
  const { t } = useTranslation('devices')
  const { colorScheme } = useMantineColorScheme()
  const dark = colorScheme === 'dark'
  const formattedSpecs = FortmatSpecs(device)
  const accordionContents = [
    t('name'),
    t('display'),
    t('battery'),
    t('hardware'),
    t('cameras'),
    t('features'),
    t('availability'),
  ]
  const [value, setValue] = useState<string[]>(accordionContents)

  if (formattedSpecs === null)
    return (
      <Container size='lg'>
        {t('deviceDoesntExist')}
        <br />
        <Link href={'/'}>
          <Button color='gray' size='lg' radius='md' mt='lg' variant='light'>
            {t('goToHomePage')}
          </Button>
        </Link>
      </Container>
    )

  return (
    <Accordion
      variant='contained'
      radius='md'
      multiple
      value={value}
      onChange={setValue}
      sx={{ marginBottom: 100 }}
      styles={{
        label: { fontSize: 28, fontWeight: 500 },
        content: { backgroundColor: dark ? 'gray.9' : 'white' },
        control: { backgroundColor: dark ? 'gray.9' : 'white' },
      }}>
      {formattedSpecs.map((category) => (
        <Accordion.Item value={category.name} key={category.name}>
          <Accordion.Control>{category.name}</Accordion.Control>
          <Accordion.Panel>
            <DeviceTable category={category.values} />
          </Accordion.Panel>
        </Accordion.Item>
      ))}
    </Accordion>
  )
}