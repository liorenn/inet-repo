import { DeviceTypeValue } from '@prisma/client'
import { router, publicProcedure, protectedProcedure } from '../trpc'
import { z } from 'zod'

export const authRouter = router({
  getSession: publicProcedure.query(({ ctx }) => {
    return ctx.session
  }),
  deleteComment: publicProcedure
    .input(z.object({ commentId: z.number() }))
    .mutation(async ({ ctx, input }) => {
      const comments = await ctx.prisma.comment.delete({
        where: { id: input.commentId },
      })
      return comments
    }),
  addComment: publicProcedure
    .input(
      z.object({
        deviceTypeValue: z.nativeEnum(DeviceTypeValue),
        likes: z.number(),
        message: z.string(),
        Rating: z.number(),
        updatedAt: z.date(),
        createdAt: z.date(),
        model: z.string(),
        username: z.string(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const {
        deviceTypeValue,
        likes,
        createdAt,
        message,
        model,
        Rating,
        updatedAt,
        username,
      } = input
      const comment = await ctx.prisma.comment.create({
        data: {
          deviceTypeValue,
          likes,
          message,
          Rating,
          updatedAt,
          createdAt,
          model,
          username,
        },
      })
      return comment
    }),
  getAllComments: publicProcedure
    .input(z.object({ model: z.string() }))
    .query(async ({ ctx, input }) => {
      const comments = await ctx.prisma.comment.findMany({
        where: { model: input.model },
      })
      return comments
    }),

  isDeviceInUser: publicProcedure
    .input(
      z.object({
        deviceModel: z.string(),
        userId: z.string().optional(),
      })
    )
    .query(async ({ ctx, input }) => {
      const device = await ctx.prisma.deviceUser.findFirst({
        where: {
          userId: input.userId,
          deviceModel: input.deviceModel,
        },
      })
      return device ? { isInList: true } : { isInList: false }
    }),
  handleDeviceToUser: publicProcedure
    .input(
      z.object({
        deviceModel: z.string(),
        userId: z.string(),
        isInList: z.boolean().optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      if (input.isInList) {
        await ctx.prisma.deviceUser.delete({
          where: {
            deviceModel_userId: {
              deviceModel: input.deviceModel,
              userId: input.userId,
            },
          },
        })
      } else {
        await ctx.prisma.deviceUser.create({
          data: { deviceModel: input.deviceModel, userId: input.userId },
        })
      }
    }),
  getUserDevices: publicProcedure
    .input(
      z.object({
        userId: z.string().optional(),
      })
    )
    .query(async ({ ctx, input }) => {
      const devices = await ctx.prisma.deviceUser.findMany({
        where: {
          userId: input.userId,
        },
      })
      const devicesArr: devicesPropertiesArrType = []
      for (let i = 0; i < devices.length; i++) {
        const device = await ctx.prisma.device.findFirst({
          where: { model: devices[i].deviceModel },
          select: {
            model: true,
            name: true,
            imageAmount: true,
            deviceTypeValue: true,
          },
        })
        if (device) {
          devicesArr.push(device)
        }
      }
      return devicesArr
    }),
  MutateUserDevices: publicProcedure
    .input(
      z.object({
        userId: z.string(),
        deviceModel: z.string(),
        action: z.enum(['insert', 'remove']),
      })
    )
    .mutation(async ({ ctx, input }) => {
      if (input.action === 'insert') {
        await ctx.prisma.deviceUser.create({
          data: {
            deviceModel: input.deviceModel,
            userId: input.userId,
          },
        })
      } else {
        await ctx.prisma.deviceUser.delete({
          where: {
            deviceModel_userId: {
              deviceModel: input.deviceModel,
              userId: input.userId,
            },
          },
        })
      }
    }),
  updateUserDetails: publicProcedure
    .input(
      z.object({
        id: z.string().optional(),
        name: z.string(),
        email: z.string(),
        username: z.string(),
        password: z.string(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const details = await ctx.prisma.user.update({
        where: { id: input.id },
        data: {
          ...input,
        },
      })
      return details
    }),
  getUserDetails: publicProcedure
    .input(z.object({ id: z.string().optional() }))
    .query(async ({ ctx, input }) => {
      const details = await ctx.prisma.user.findFirst({
        where: { id: input.id },
      })
      return details
    }),
  CreateUser: publicProcedure
    .input(
      z.object({
        id: z.string(),
        name: z.string(),
        email: z.string(),
        username: z.string(),
        password: z.string(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      await ctx.prisma.user.create({
        data: {
          id: input.id,
          email: input.email,
          name: input.name,
          password: input.password,
          username: input.username,
          role: 'USER',
          comments: { create: [] },
          deviceList: { create: [] },
        },
      })
    }),
  IsUserExists: publicProcedure
    .input(
      z.object({
        email: z.string(),
        password: z.string(),
        username: z.string().optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const emailUser = await ctx.prisma.user.findFirst({
        where: {
          email: input.email,
          password: input.password,
        },
      })
      const usernameUser = await ctx.prisma.user.findFirst({
        where: { username: input?.username },
      })
      if (!emailUser && !usernameUser) {
        return { email: false, username: false }
      }
      if (!emailUser && usernameUser) {
        return { email: false, username: true }
      }
      if (emailUser && emailUser.username === input?.username) {
        return { email: true, username: true }
      }
      if (emailUser && emailUser.username !== input?.username) {
        return { email: true, username: false }
      }
    }),
})

export type devicesPropertiesArrType = {
  model: string
  name: string
  imageAmount: number
  deviceTypeValue: DeviceTypeValue
}[]
