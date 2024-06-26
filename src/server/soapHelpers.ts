// Importing the XMLParser class from the fast-xml-parser library

import { XMLParser } from 'fast-xml-parser'

// Defining the SOAP request headers
export const soapRequestHeaders = {
  'Content-Type': 'text/xml;charset=UTF-8',
}

// Defining the structure of a method parameter
type MethodParameter = {
  Name: string
  Value: string
}

// Function to create a SOAP request XML
export function createSoapRequestXml(Method: string, Parameter?: MethodParameter) {
  return `
  <soapenv:Envelope xmlns:soapenv="http://schemas.xmlsoap.org/soap/envelope/" xmlns:tem="http://tempuri.org/">
    <soapenv:Header/>
    <soapenv:Body>
      <tem:${Method}>${
    Parameter ? `<tem:${Parameter.Name}>${Parameter.Value}</tem:${Parameter.Name}>` : ''
  }</tem:${Method}>
    </soapenv:Body>
  </soapenv:Envelope>
  `
}

// Function to extract the result from a SOAP response XML
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function getResultFromResponse(Method: string, xml: any): string {
  const parser = new XMLParser() // Create a xml parser
  // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-argument
  const json = parser.parse(xml) // Convert the xml to json
  // eslint-disable-next-line @typescript-eslint/no-unsafe-return, @typescript-eslint/no-unsafe-member-access
  return json['soap:Envelope']['soap:Body'][`${Method}Response`][`${Method}Result`] // Extract the result
}
