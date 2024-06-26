// Importing necessary modules and types

import { Button, SimpleGrid, TextInput } from '@mantine/core' // Importing components from Mantine core
import { Dispatch, SetStateAction, useEffect, useState } from 'react' // Importing necessary hooks and types from React

import Loader from '@/components/layout/Loader' // Importing Loader component from components/layout
import { managerAccessKey } from 'config' // Importing managerAccessKey from config
import { trpc } from '@/utils/client' // Importing trpc instance from utils/client
import { useRouter } from 'next/router' // Importing useRouter hook from next/router
import useTranslation from 'next-translate/useTranslation' // Importing useTranslation hook from next-translate

// Defining breakpoints for the SimpleGrid component
const breakpoints = [
  { minWidth: 300, cols: 1 },
  { minWidth: 500, cols: 2 },
  { minWidth: 800, cols: 3 },
]

// Defining the props for the ConfigsEditor component
type Props = {
  accessKey: number
}

// Defining the configType for configuration values
type ConfigType = {
  name: string
  value: string
}

// Function to check if a string represents a boolean value
function isStringBoolean(value: string): boolean {
  return value === 'true' || value === 'false' // Returns true if the value is true or false
}

// Function to check if a string represents a number
function isStringNumber(value: string): boolean {
  return !Number.isNaN(Number(value)) // Returns true if the value is a valid number
}

// Defining the validationType for configuration value validation
type ValidationType = 'number' | 'boolean' | 'string'

// Regular expressions for different types of configuration values
const stringRegex = /^[A-Za-z0-9 _,/@.:?]{2,}$/
const booleanRegex = /^(true|false)?$/
const numberRegex = /^-?\d+$/

// Function to validate a string based on its type
function validateConfig(value: string, validation: ValidationType): string | null {
  switch (validation) {
    case 'number': // If the validation type is number
      return numberRegex.test(value) ? null : 'Must be a number' // If value didnt pass the regex return a number warning
    case 'boolean': // If the validation type is boolean
      return booleanRegex.test(value) ? null : 'Must be a boolean' // If value didnt pass the regex return a boolean warning
    case 'string': // If the validation type is string
      return stringRegex.test(value) ? null : 'Must be a string' // If value didnt pass the regex return a string warning
    default: // If the validation type is invalid
      return null // Return null
  }
}

// Function to determine the type of a configuration value
function getValidation(value: string): ValidationType {
  // Returns the validation type of the configuration value
  return isStringNumber(value) ? 'number' : isStringBoolean(value) ? 'boolean' : 'string'
}

// Function to convert a string of configurations into an array of configType objects
function getConfigsArray(configs: string) {
  return configs
    .replace(/\r?\n|\'|\s+/g, '') // Remove newlines and whitespace
    .split('exportconst') // Split the string into an array of configurations
    .map((value) => {
      // Map the array of configurations to an array of configType objects
      return { name: value.split('=')[0], value: value.split('=')[1] }
    })
    .filter((value) => value.value !== undefined) // Filter out any undefined values
}

// Function to convert an array of configType objects into a string of configurations
function stringifyConfigsArray(configsArray: ConfigType[]): string {
  return configsArray
    .map((value) => {
      // Map the array of configType objects to an array of strings
      const parsedValue =
        isStringNumber(value.value) || isStringBoolean(value.value)
          ? value.value
          : `'${value.value}'`
      return `export const ${value.name} = ${parsedValue}\r\n` // Return a string of configurations
    })
    .join('') // Join the array of strings into a single string
}

// Defining the ConfigsEditor component
export default function ConfigsEditor({ accessKey }: Props) {
  const router = useRouter() // Get the router

  // When access key changes
  useEffect(() => {
    // If the access key is smaller than the manager access key
    if (accessKey && accessKey < managerAccessKey) {
      // eslint-disable-next-line @typescript-eslint/no-floating-promises
      router.push('/') // Redirect to the home page
    }
  }, [accessKey, router])

  const { t } = useTranslation('main') // Getting the translation function from next-translate
  const configsQuery = trpc.auth.getConfigs.useQuery() // Querying for configurations using trpc
  const saveConfigsMutation = trpc.auth.saveConfigs.useMutation() // Mutation function for saving configurations using trpc
  const [configs, setConfigs] = useState<ConfigType[]>([]) // State for holding the configurations as an array of configType objects

  // When configs query data changes
  useEffect(() => {
    // Populating the configs state when data is available
    if (configsQuery.data) {
      setConfigs(getConfigsArray(configsQuery.data)) // Set the configs state
    }
  }, [configsQuery.data, router])

  // Function to validate configuration values based on their types
  function validateValues(values: ConfigType[]) {
    if (!configsQuery.data) return false // If configs data is not available return false
    return values
      .map((value, index) => {
        // Map the array of configType objects to an array of validation results
        return validateConfig(
          value.value,
          getValidation(getConfigsArray(configsQuery.data)[index].value)
        )
      })
      .every((value) => value === null) // Return true if all validation results are null which means the values are valid
  }

  // Function to save configurations if they are valid
  function saveConfigs() {
    // If the configurations are valid
    if (validateValues(configs)) {
      saveConfigsMutation.mutate({ configs: stringifyConfigsArray(configs) }) // Save the configurations
    }
  }

  // Displaying a loader while configurations are being fetched
  if (!configsQuery.data) return <Loader />

  // Rendering the configuration inputs and action buttons
  return (
    <>
      <SimpleGrid breakpoints={breakpoints}>
        {configs.map((config, index) => (
          <ConfigInput
            key={index}
            config={config}
            originalValue={getConfigsArray(configsQuery.data)[index].value}
            setConfigs={setConfigs}
          />
        ))}
      </SimpleGrid>
      <Button
        mt='xl'
        variant='light'
        color='green'
        fullWidth
        onClick={() => {
          saveConfigs() // Save the configurations
        }}>
        {t('updateConfigs')}
      </Button>
    </>
  )
}

// Props type for the ConfigInput component
type ConfigInputProps = {
  config: ConfigType
  originalValue: string
  setConfigs: Dispatch<SetStateAction<ConfigType[]>>
}

// Component for rendering a single configuration input with validation and change handling
function ConfigInput({ config, originalValue, setConfigs }: ConfigInputProps) {
  const validation = getValidation(originalValue) // Getting the validation type of the original value
  const { t } = useTranslation('main') // Getting the translation function from next translate

  // Rendering a TextInput component for the configuration with validation and change handling
  return (
    <TextInput
      placeholder={t('enterConfigValue')}
      label={t(config.name)}
      value={config.value}
      error={validateConfig(config.value, validation)}
      onChange={(event) =>
        setConfigs((prev) =>
          prev.map((value) =>
            value.name === config.name ? { name: config.name, value: event.target.value } : value
          )
        )
      }
    />
  )
}
