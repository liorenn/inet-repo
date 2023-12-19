import { FortmatSpecs, type deviceSpecsType } from '../../models/SpecsFormatter'
import { useMantineColorScheme } from '@mantine/core'
import { Accordion } from '@mantine/core'
import useTranslation from 'next-translate/useTranslation'
import { useState } from 'react'
import { useViewportSize } from '@mantine/hooks'
import DeviceTable from './DeviceTable'

type Props = {
  device1: deviceSpecsType
  device2: deviceSpecsType
}

export type categoriesType = {
  name: string
  values: {
    label: string
    info: string
  }[]
}[]

type MergedCategoriesType = {
  name: string
  values: {
    label: string
    info1: string
    info2: string
  }[]
}[]

export default function DevicesSpecs({ device1, device2 }: Props) {
  const { t } = useTranslation('devices')
  const { width } = useViewportSize()
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
  const { colorScheme } = useMantineColorScheme()
  const dark = colorScheme === 'dark'
  const categories1 = FortmatSpecs(device1)
  const categories2 = FortmatSpecs(device2)
  const mergedCategories = mergeCategories(categories1, categories2)

  function mergeCategories(
    originalCategories: categoriesType,
    additionalCategories: categoriesType
  ): MergedCategoriesType {
    const mergedCategories: MergedCategoriesType = []
    mergedCategories.push({
      name: t('name'),
      values: [{ label: t('name'), info1: device1.name, info2: device2.name }],
    })
    for (let i = 0; i < originalCategories.length; i++) {
      const originalCategory = originalCategories[i]
      const additionalCategory = additionalCategories[i]

      if (originalCategory && additionalCategory) {
        const mergedValues = originalCategory.values.map(
          (originalValue, index) => ({
            label: originalValue.label,
            info1: originalValue.info,
            info2: additionalCategory.values[index]?.info || '', // Ensure info2 exists
          })
        )
        mergedCategories.push({
          name: originalCategory.name,
          values: mergedValues,
        })
      }
    }
    return mergedCategories
  }

  return (
    <Accordion
      variant='contained'
      radius='md'
      multiple
      value={value}
      onChange={setValue}
      sx={{ marginBottom: 100 }}
      styles={{
        label: { fontSize: width < 500 ? 20 : 26, fontWeight: 500 },
        content: { backgroundColor: dark ? 'gray.9' : 'white' },
        control: { backgroundColor: dark ? 'gray.9' : 'white' },
      }}>
      {mergedCategories.map((category) => (
        <Accordion.Item value={category.name} key={category.name}>
          <Accordion.Control>{category.name}</Accordion.Control>
          <Accordion.Panel>
            <DeviceTable
              category={category.values.map((item) => ({
                label: item.label,
                info: item.info1,
              }))}
              secondCatergory={category.values.map((item) => ({
                label: item.label,
                info: item.info2,
              }))}
            />
          </Accordion.Panel>
        </Accordion.Item>
      ))}
    </Accordion>
  )
}