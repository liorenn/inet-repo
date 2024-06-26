import { Center, Container, ScrollArea, SegmentedControl, Table } from '@mantine/core'
import { useSession, useUser } from '@supabase/auth-helpers-react'

import Loader from '@/components/layout/Loader'
import { managerAccessKey } from 'config'
import { trpc } from '@/utils/client'
import { useRouter } from 'next/router'
import { useState } from 'react'
import useTranslation from 'next-translate/useTranslation'
import { useViewportSize } from '@mantine/hooks'

// The component props
type Props = {
  accessKey: number
}

/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable @typescript-eslint/no-unsafe-argument */
/* eslint-disable @typescript-eslint/no-unsafe-call */
/* eslint-disable @typescript-eslint/no-unsafe-member-access */
/* eslint-disable @typescript-eslint/no-unsafe-assignment */

// Function to find an object in an array by a property value
function findObjectByPropertyValue<T>(array: T[], name: keyof T, value: T[keyof T]) {
  return array.find((item) => item[name] === value) // Find the object in the array
}

export default function DatabaseViewer({ accessKey }: Props) {
  const user = useUser() // Get the user object from Supabase
  const router = useRouter() // Get the router object from Next.js
  const session = useSession() // Get the session object from Supabase
  const { width } = useViewportSize() // Get the viewport size
  const { t } = useTranslation('main') // Get the translation function from Next.js
  const [table, setTable] = useState('') // State variable to store the selected table
  const [loading, setLoading] = useState(false) // State variable to store the loading state
  const tablesPropertiesQuery = trpc.auth.getTablesProperties.useQuery() // Query to get the properties of the tables
  const getTableDataMutation = trpc.auth.getTableData.useMutation() // Mutation to get the data of the selected table
  const [tableData, setTableData] = useState<string[][]>([]) // State variable to store the data of the selected table

  if (accessKey < managerAccessKey) {
    // If the access key is less than the manager access key
    // eslint-disable-next-line @typescript-eslint/no-floating-promises
    router.push('/') // Redirect to the home page
  }

  // Change the table name
  function changeTableName(tableName: string) {
    setLoading(true) // Set the loading state to true
    setTable(tableName) // Set the selected table
    // Get the data of the selected table
    getTableDataMutation.mutate(
      { tableName: tableName },
      {
        onSuccess(unknownData) {
          const data = unknownData as any // Cast the unknown data to an array
          const stringArrays: string[][] = data.map((obj: any) =>
            // Convert the unknown data to an array of objects
            Object.values(obj).map((value) => {
              // If the value is a date
              if (value instanceof Date) {
                // Convert the value to a string
                return value.toLocaleDateString('en-us', {
                  weekday: 'short',
                  year: 'numeric',
                  month: 'short',
                  day: 'numeric',
                })
              }
              return String(value) // Convert the value to a string
            })
          )
          setTableData(stringArrays) // Set the data of the selected table
          setLoading(false) // Set the loading state to false
        },
      }
    )
  }

  // If the user or session is not available
  if (!(user && session)) {
    return <Center>{t('accessDeniedMessageSignIn')}</Center>
  }

  // If the tables names or data is not loaded
  if (!(tablesPropertiesQuery.data && tableData)) {
    return <Loader />
  }

  return (
    <>
      <Container size='xl'>
        <ScrollArea mb='lg' type={width < 400 ? 'always' : 'auto'}>
          <SegmentedControl
            data={tablesPropertiesQuery.data.map((value) => value.name)}
            onChange={(tableName) => changeTableName(tableName)}
            value={table}
            fullWidth
            size='md'
            radius='md'
            mb='sm'
          />
        </ScrollArea>
        <ScrollArea type={width < 400 ? 'always' : 'auto'}>
          {tableData.length > 0 && !loading ? ( // If there is data and the data finished loading
            <Table striped highlightOnHover withBorder withColumnBorders>
              <thead>
                <tr>
                  {findObjectByPropertyValue(
                    tablesPropertiesQuery.data,
                    'name',
                    table
                  )?.fields?.map((value, index) => {
                    if (!value.relationName) return <th key={index}>{value.name}</th>
                  })}
                </tr>
              </thead>
              <tbody>
                {tableData.map((value, index) => {
                  return (
                    <tr key={index}>
                      {value.map((value, index) => {
                        return <td key={index}>{value}</td>
                      })}
                    </tr>
                  )
                })}
              </tbody>
            </Table>
          ) : loading ? ( // If the loading state is true
            <Loader />
          ) : (
            // If there is not data
            <Center>{t('noData')}</Center>
          )}
        </ScrollArea>
      </Container>
    </>
  )
}
