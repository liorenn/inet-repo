/* eslint-disable @typescript-eslint/no-misused-promises */
import { Paper, Group, Text, ActionIcon, Avatar, TextInput, Grid } from '@mantine/core'
import { Tooltip, Rating } from '@mantine/core'
import type { Comment } from '@prisma/client'
import { IconTrash, IconPencil, IconCheck } from '@tabler/icons'
import { useState } from 'react'
import { trpc } from '@/server/client'
import { calculateAverageRating, CreateNotification, encodeEmail } from '@/utils/utils'
import useTranslation from 'next-translate/useTranslation'
import { useUser } from '@supabase/auth-helpers-react'
import { useComments } from '@/hooks/useComments'
import { adminAccessKey } from 'config'

type props = {
  comment: Comment
  comments: Comment[]
  setComments: (value: Comment[]) => void
}

export default function Comment({ comment, comments, setComments }: props) {
  const user = useUser()
  const [rating, setRating] = useState(comment.rating)
  const [editing, setEditing] = useState(false)
  const [editText, setEditText] = useState(comment.message)
  const { data: accessKey } = trpc.auth.getAccessKey.useQuery({
    email: user?.email,
  })
  const { data: imageExists } = trpc.auth.isCommentImageExists.useQuery({
    username: comment.username,
  })
  const { data: commentEmail } = trpc.auth.getCommentEmail.useQuery({
    username: comment.username,
  })
  const { mutateAsync: mutateDelete } = trpc.auth.deleteComment.useMutation()
  const { mutateAsync: mutateEdit } = trpc.auth.editComment.useMutation()
  const { setCommentsAmount, setRatingValue, username } = useComments()
  const { t } = useTranslation('translations')

  async function deleteComment() {
    await mutateDelete(
      { commentId: comment.id },
      {
        onSuccess() {
          CreateNotification(t('commentDeletedSuccessfully'), 'green')
        },
      }
    )
    const newArr: Comment[] = []
    comments.forEach((iteratedComment) => {
      if (iteratedComment.id !== comment.id) {
        newArr.push(iteratedComment)
      }
    })
    setComments([...newArr])
    setCommentsAmount(newArr.length)
    setRatingValue(calculateAverageRating(newArr))
  }

  async function editComment() {
    await mutateEdit(
      { commentId: comment.id, message: editText, rating: rating },
      {
        onSuccess() {
          CreateNotification(t('commentEditedSuccessfully'), 'green')
        },
      }
    )
    const newComments = comments.map((comment) =>
      comment.id === comment.id ? { ...comment, message: editText, rating } : comment
    )
    setComments(newComments)
    setRatingValue(calculateAverageRating(newComments))
    setEditing(false)
  }

  return (
    <Paper withBorder radius='md' sx={{ padding: 10, marginTop: 20 }}>
      <Group position='apart' sx={{ marginBottom: 10 }}>
        <Group sx={{ padding: 10 }}>
          {user?.email && (
            <Avatar
              src={imageExists && commentEmail ? `/users/${encodeEmail(commentEmail)}.png` : ''}
              radius='md'
            />
          )}
          <div>
            <Text size='lg' weight={500}>
              {comment.username}
            </Text>
            <Text size='xs' weight={400}>
              {comment.createdAt.toDateString()}
            </Text>
          </div>
        </Group>
        <Group sx={{ padding: 10 }}>
          <Rating readOnly={!editing} value={rating} onChange={setRating} />
          {(comment.username === username || (accessKey && accessKey >= adminAccessKey)) && (
            <>
              <Tooltip color='gray' label={t('edit')}>
                <ActionIcon color='dark'>
                  <IconPencil onClick={() => setEditing(!editing)} />
                </ActionIcon>
              </Tooltip>
              <Tooltip color='gray' label={t('delete')}>
                <ActionIcon color='dark' onClick={deleteComment}>
                  <IconTrash />
                </ActionIcon>
              </Tooltip>
            </>
          )}
        </Group>
      </Group>

      {editing ? (
        <Grid mr='xs'>
          <Grid.Col span={11}>
            <TextInput
              value={editText}
              onChange={(event) => setEditText(event.currentTarget.value)}
            />
          </Grid.Col>
          <Grid.Col span={1}>
            <ActionIcon w='100%' h='100%' variant='light' onClick={() => editComment()}>
              <IconCheck color='green' />
            </ActionIcon>
          </Grid.Col>
        </Grid>
      ) : (
        <Text ml='sm' mb='sm'>
          {comment.message}
        </Text>
      )}
    </Paper>
  )
}
