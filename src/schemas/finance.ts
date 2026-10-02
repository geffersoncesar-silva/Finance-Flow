import { z } from 'zod'

export const categorySchema = z.object({
  name: z.string().min(2, 'Informe o nome da categoria.'),
  type: z.enum(['income', 'expense']),
  icon: z.string().min(1, 'Selecione um ícone.'),
  description: z.string().min(2, 'Descreva a categoria.'),
  active: z.boolean().default(true),
})

export const transactionSchema = z.object({
  description: z.string().min(2, 'Informe uma descrição.'),
  type: z.enum(['income', 'expense']),
  amount: z.coerce.number().positive('Informe um valor maior que zero.'),
  date: z.string().min(1, 'Informe uma data válida.'),
  categoryId: z.string().min(1, 'Selecione uma categoria.'),
  accountId: z.string().optional(),
  cardId: z.string().optional(),
  paymentMethod: z.enum(['cash', 'debit', 'credit', 'transfer']),
  status: z.enum(['paid', 'pending', 'cancelled']),
  notes: z.string().optional().default(''),
  recurring: z.enum(['none', 'monthly', 'weekly', 'annual']),
  installmentCurrent: z.coerce.number().int().min(1).optional(),
  installmentsTotal: z.coerce.number().int().min(1).optional(),
})

export const goalSchema = z.object({
  name: z.string().min(2, 'Informe o nome da meta.'),
  target: z.coerce.number().positive('Informe um valor objetivo.'),
  current: z.coerce.number().min(0, 'Valor atual inválido.'),
  deadline: z.string().min(1, 'Informe a data limite.'),
  description: z.string().min(2, 'Descreva a meta.'),
  status: z.enum(['active', 'completed']),
})
