import { type DeviceSpecsType, formatArrSpecs } from '@/models/SpecsFormatter'
import { useMantineColorScheme } from '@mantine/core'
import { Accordion } from '@mantine/core'
import useTranslation from 'next-translate/useTranslation'
import { useState } from 'react'
import { useViewportSize } from '@mantine/hooks'
import DevicesTable from '@/components/device/DevicesTable'
import { devicesSpecsCategories } from '@/models/deviceProperties'

// The component props
type Props = {
  devices: DeviceSpecsType[]
}

export default function DevicesSpecs({ devices }: Props) {
  const { t } = useTranslation('main')
  const { colorScheme } = useMantineColorScheme()
  const { width } = useViewportSize()
  const [accordionState, setAccordionState] = useState<string[]>(devicesSpecsCategories)
  const mergedCategories = formatArrSpecs(devices)

  return (
    <Accordion
      multiple
      radius='md'
      variant='contained'
      value={accordionState}
      onChange={setAccordionState}
      sx={{ marginBottom: 100 }}
      styles={{
        label: { fontSize: width < 500 ? 20 : 26, fontWeight: 500 },
        content: {
          backgroundColor: colorScheme === 'dark' ? 'gray.9' : 'white',
        },
        control: {
          backgroundColor: colorScheme === 'dark' ? 'gray.9' : 'white',
        },
      }}>
      {mergedCategories.map((category, index) => (
        <Accordion.Item value={category.name} key={index}>
          <Accordion.Control>{t(category.name)}</Accordion.Control>
          <Accordion.Panel>
            <DevicesTable specs={category.specs} name={category.name} />
          </Accordion.Panel>
        </Accordion.Item>
      ))}
    </Accordion>
  )
}
