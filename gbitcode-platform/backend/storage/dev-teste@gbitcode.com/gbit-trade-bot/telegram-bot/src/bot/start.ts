import { Composer, InlineKeyboard } from 'grammy'
import type { Context } from './context.js'
import { config } from 'dotenv' 

config()

const composer = new Composer<Context>()
const feature = composer.chatType('private')

feature.command('start', async (ctx) => {
  // Gbit Trade Bot - Versão SIMPLES sem thirdweb por agora
  const keyboard = new InlineKeyboard()
    .webApp('🚀 Abrir Gbit Trade Bot', 'http://localhost:3000')
  
  return ctx.reply('🤖 *Gbit Trade Bot* ativado!\n\nClique abaixo para conectar wallet e fazer trades!', { 
    reply_markup: keyboard,
    parse_mode: 'Markdown'
  })
})

export { composer as startFeature }
