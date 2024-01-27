import { convertPreferencesToValues, getRecommendedDevices } from '@/server/match'
import { deleteDeviceSoap, insertDeviceSoap, updateDeviceSoap } from '@/server/soapFunctions'
import { getMatchedDevices } from '@/server/match'
import { method, router } from '@/server/trpc'

import { selectProprties, type DevicePropertiesType } from '@/models/enums'
import { deviceSchema, MatchDeviceType, PropertiesSchema } from '@/models/schemas'
import { matchedDevicesLimit, sendSoapRequest } from 'config'
import { z } from 'zod'
import { selectParams } from '@/models/deviceProperties'
import { convertPrice } from '@/server/price'

export const DeviceRouter = router({
  convertPrice: method
    .input(
      z.object({
        price: z.number(),
        currency: z.string(),
        targetCurrency: z.string(),
      })
    )
    .mutation(async ({ input }) => {
      return convertPrice(input.price, input.currency, input.targetCurrency)
    }),
  getRecommendedDevices: method
    .input(z.object({ model: z.string(), deviceType: z.string() }))
    .query(async ({ ctx, input }) => {
      const device = await ctx.prisma.device.findFirst({
        select: selectParams,
        where: {
          model: input.model,
        },
      })
      if (!device) return []
      const devices: MatchDeviceType[] = await ctx.prisma.device.findMany({
        select: selectParams,
        where: {
          model: {
            not: input.model,
          },
        },
      })
      const matches = getRecommendedDevices(device, input.deviceType, devices)
      const query = await ctx.prisma.device.findMany({
        select: selectProprties,
        where: {
          model: {
            in: matches.map((device) => device.model),
          },
        },
      })
      const recommendedDevices = query.map((device, index) => {
        return { ...device, match: matches[index].match }
      })
      return recommendedDevices.sort((a, b) => b.match - a.match)
    }),
  getMatchedDevices: method
    .input(
      z.object({
        deviceType: z.string(),
        userPreferences: z.array(z.object({ name: PropertiesSchema, value: z.number() })),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const devices = await ctx.prisma.device.findMany({
        select: selectParams,
        where: {
          type: input.deviceType,
        },
      })
      const preferencesValues = convertPreferencesToValues(input.userPreferences, input.deviceType)
      const matches = getMatchedDevices(
        preferencesValues,
        devices,
        input.deviceType,
        matchedDevicesLimit
      )
      const query = await ctx.prisma.device.findMany({
        select: selectProprties,
        where: {
          model: {
            in: matches.map((device) => device.model),
          },
        },
      })
      const matchedDevices = query.map((device, index) => {
        return { ...device, match: matches[index].match }
      })
      return matchedDevices.sort((a, b) => b.match - a.match)
    }),
  insertDevice: method
    .input(deviceSchema.merge(z.object({ FromAsp: z.boolean().optional() })))
    .mutation(async ({ ctx, input }) => {
      try {
        const { FromAsp, ...device } = input
        await ctx.prisma.device.create({
          data: {
            ...device,
          },
        })
        if (sendSoapRequest && FromAsp !== true) {
          await insertDeviceSoap({ input: device })
        }
        return true
      } catch {
        return false
      }
    }),
  updateDevice: method
    .input(deviceSchema.merge(z.object({ FromAsp: z.boolean().optional() })))
    .mutation(async ({ ctx, input }) => {
      process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0'
      try {
        const { FromAsp, ...device } = input
        await ctx.prisma.device.update({
          where: { model: device.model },
          data: {
            ...device,
          },
        })
        if (sendSoapRequest && FromAsp !== true) {
          await updateDeviceSoap({ input: device })
        }
        return true
      } catch {
        return false
      }
    }),
  deleteDevice: method
    .input(z.object({ model: z.string(), FromAsp: z.boolean().optional() }))
    .mutation(async ({ ctx, input }) => {
      try {
        const { FromAsp, model } = input
        await ctx.prisma.device.delete({
          where: { model },
        })
        if (sendSoapRequest && FromAsp !== true) {
          await deleteDeviceSoap({ model: input.model })
        }
        return true
      } catch {
        return false
      }
    }),
  getDevicesData: method.query(async ({ ctx }) => {
    return await ctx.prisma.device.findMany()
  }),
  getDevices: method.input(z.object({ deviceType: z.string() })).query(async ({ ctx, input }) => {
    return await ctx.prisma.device.findMany({
      select: selectProprties,
      where: {
        deviceType: {
          name: input.deviceType,
        },
      },
    })
  }),
  getDevice: method.input(z.object({ model: z.string() })).query(async ({ ctx, input }) => {
    const device = await ctx.prisma.device.findFirst({
      where: { model: input.model },
      include: {
        cameras: { select: { type: true, megapixel: true } },
        colors: { select: { color: true } },
      },
    })
    return device
  }),
  getDevicesFromModelsArr: method
    .input(z.object({ modelsArr: z.array(z.string()).optional() }))
    .query(async ({ ctx, input }) => {
      if (!input.modelsArr) return []
      const devices = await ctx.prisma.device.findMany({
        where: {
          model: {
            in: input.modelsArr,
          },
        },
        include: {
          cameras: { select: { type: true, megapixel: true } },
          colors: { select: { color: true } },
        },
      })
      return devices
    }),
  getModelsAndNames: method.query(async ({ ctx }) => {
    const devices = await ctx.prisma.device.findMany({
      select: { model: true, name: true },
    })
    return devices
  }),
  isDeviceInUser: method
    .input(z.object({ model: z.string(), email: z.string().optional() }))
    .query(async ({ ctx, input }) => {
      const user = await ctx.prisma.user.findFirst({
        where: { email: input.email },
        select: { deviceList: true },
      })
      return user?.deviceList?.find((device) => device.deviceModel === input.model) !== undefined
    }),
  addToFavorites: method
    .input(z.object({ model: z.string(), email: z.string() }))
    .mutation(async ({ ctx, input }) => {
      await ctx.prisma.user.update({
        where: { email: input.email },
        data: {
          deviceList: {
            create: {
              deviceModel: input.model,
            },
          },
        },
      })
    }),
  deleteFromFavorites: method
    .input(z.object({ model: z.string(), email: z.string() }))
    .mutation(async ({ ctx, input }) => {
      await ctx.prisma.user.update({
        where: { email: input.email },
        data: {
          deviceList: {
            delete: {
              deviceModel_userEmail: {
                deviceModel: input.model,
                userEmail: input.email,
              },
            },
          },
        },
      })
    }),
  getUserDevices: method
    .input(
      z.object({
        email: z.string().optional(),
      })
    )
    .query(async ({ ctx, input }) => {
      const devices = await ctx.prisma.deviceUser.findMany({
        where: {
          userEmail: input.email,
        },
      })
      const devicesArr: DevicePropertiesType[] = []
      for (const device of devices) {
        const userDevice = await ctx.prisma.device.findFirst({
          where: { model: device.deviceModel },
          select: {
            model: true,
            name: true,
            imageAmount: true,
            type: true,
          },
        })
        if (userDevice) {
          devicesArr.push(userDevice)
        }
      }
      return devicesArr
    }),
  getUserDevicesFromUserTable: method
    .input(z.object({ email: z.string().optional() }))
    .query(async ({ ctx, input }) => {
      return await ctx.prisma.user.findFirst({
        where: { email: input.email },
        select: {
          deviceList: {
            select: {
              device: {
                select: {
                  model: true,
                  name: true,
                  type: true,
                  imageAmount: true,
                },
              },
            },
          },
        },
      })
    }),
})
