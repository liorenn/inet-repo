import { XMLBuilder, XMLParser } from 'fast-xml-parser'

export const soapRequestHeaders = {
  'Content-Type': 'text/xml;charset=UTF-8',
}

type MethodParameter = {
  Name: string
  Value: string
}

export function createSoapRequestXml(
  Method: string,
  Parameters: MethodParameter[]
) {
  return `
  <soapenv:Envelope xmlns:soapenv="http://schemas.xmlsoap.org/soap/envelope/" xmlns:tem="http://tempuri.org/">
  <soapenv:Header/>
  <soapenv:Body>
     <tem:${Method}>
        ${Parameters.map(
          (property) =>
            `<tem:${property.Name}>${property.Value}</tem:${property.Name}>`
        ).join('')}
     </tem:${Method}>
  </soapenv:Body>
</soapenv:Envelope>
  `
}

const builder = new XMLBuilder()
const xmlContent = builder.build({ name: 'hello', value: 'world' })

export function getResultFromResponse(Method: string, xml: any): string {
  const parser = new XMLParser()
  const json = parser.parse(xml)
  return json['soap:Envelope']['soap:Body'][Method + 'Response'][
    Method + 'Result'
  ]
}