import path from 'node:path'
import { defineConfig } from 'prisma/config'

export default defineConfig({
  datasource: {
    url: `file:${path.resolve(__dirname, 'prisma', 'dev.db').replace(/\\/g, '/')}`,
  },
})
