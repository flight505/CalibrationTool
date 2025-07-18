I'll create a comprehensive, detailed markdown checklist for building the OrcaSlicer RAG chatbot. Let me think through every implementation detail to ensure nothing is missed.

# OrcaSlicer RAG Chatbot Implementation Checklist

## Project Setup and Configuration

### Initial Project Setup
- [ ] Create new Next.js 14 project with TypeScript: `pnpm create next-app orcaslicer-assistant --typescript --tailwind --app --no-src-dir`
- [ ] Initialize git repository: `git init`
- [ ] Create `.gitignore` file with entries for `.env.local`, `knowledge-base/`, `node_modules/`, `.next/`, `*.log`
- [ ] Create project directory structure:
  ```
  orcaslicer-assistant/
  ├── app/
  ├── components/
  ├── lib/
  ├── scripts/
  ├── knowledge-base/
  └── public/
  ```

### Dependencies Installation
- [ ] Install core dependencies: `pnpm add openai @vercel/postgres pgvector lightrag`
- [ ] Install Vercel AI SDK: `pnpm add ai @ai-sdk/openai`
- [ ] Install database utilities: `pnpm add drizzle-orm drizzle-kit postgres`
- [ ] Install CLI tools: `pnpm add commander chalk ora cli-table3`
- [ ] Install Firecrawl: `pnpm add @mendable/firecrawl-js`
- [ ] Install development dependencies: `pnpm add -D tsx dotenv @types/node`
- [ ] Install streaming utilities: `pnpm add eventsource-parser`
- [ ] Install validation: `pnpm add zod`

### Link to LightRAG github repo:
https://github.com/HKUDS/LightRAG 
use the latest version of LightRAG and study the README on the repo to understand the usage and how to use it.

### Environment Configuration
- [ ] Create `.env.local` file with:
  ```
  OPENAI_API_KEY=
  FIRECRAWL_API_KEY=
  POSTGRES_URL=
  POSTGRES_PRISMA_URL=
  POSTGRES_URL_NO_SSL=
  POSTGRES_URL_NON_POOLING=
  POSTGRES_USER=
  POSTGRES_HOST=
  POSTGRES_PASSWORD=
  POSTGRES_DATABASE=
  ```
- [ ] Create `.env.production` file with production OpenAI key only
- [ ] Add environment type definitions in `env.d.ts`:
  ```typescript
  declare namespace NodeJS {
    interface ProcessEnv {
      OPENAI_API_KEY: string
      FIRECRAWL_API_KEY: string
      POSTGRES_URL: string
      // ... other env vars
    }
  }
  ```

## Database Setup

### PostgreSQL Configuration
- [ ] Create `lib/db/schema.sql` with pgvector setup:
  ```sql
  CREATE EXTENSION IF NOT EXISTS vector;
  CREATE EXTENSION IF NOT EXISTS pg_trgm;
  
  CREATE TABLE IF NOT EXISTS orcaslicer_docs (
    id SERIAL PRIMARY KEY,
    title TEXT NOT NULL,
    content TEXT NOT NULL,
    url TEXT,
    section_path TEXT,
    embedding VECTOR(1536),
    metadata JSONB DEFAULT '{}',
    doc_hash VARCHAR(64) UNIQUE,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
  );
  
  CREATE INDEX idx_embedding_cosine ON orcaslicer_docs 
  USING ivfflat (embedding vector_cosine_ops) WITH (lists = 100);
  
  CREATE INDEX idx_content_gin ON orcaslicer_docs 
  USING gin(to_tsvector('english', content));
  
  CREATE INDEX idx_metadata ON orcaslicer_docs USING GIN (metadata);
  ```

### Drizzle ORM Setup
- [ ] Create `lib/db/schema.ts`:
  ```typescript
  import { pgTable, serial, text, timestamp, jsonb, index } from 'drizzle-orm/pg-core'
  import { vector } from 'pgvector/drizzle-orm'
  
  export const orcaslicerDocs = pgTable('orcaslicer_docs', {
    id: serial('id').primaryKey(),
    title: text('title').notNull(),
    content: text('content').notNull(),
    url: text('url'),
    sectionPath: text('section_path'),
    embedding: vector('embedding', { dimensions: 1536 }),
    metadata: jsonb('metadata').default({}),
    docHash: text('doc_hash').unique(),
    createdAt: timestamp('created_at').defaultNow(),
    updatedAt: timestamp('updated_at').defaultNow()
  })
  ```

- [ ] Create `lib/db/index.ts` for database connection:
  ```typescript
  import { drizzle } from 'drizzle-orm/vercel-postgres'
  import { sql } from '@vercel/postgres'
  import * as schema from './schema'
  
  export const db = drizzle(sql, { schema })
  ```

## LightRAG Integration

### LightRAG Configuration
- [ ] Create `lib/lightrag/config.ts`:
  ```typescript
  export const lightragConfig = {
    working_dir: './knowledge-base',
    llm_model_func: 'gpt-4-turbo-preview',
    llm_model_max_token_size: 128000,
    llm_model_max_async: 16,
    embedding_func: {
      model: 'text-embedding-3-small',
      dimensions: 1536,
      batch_size: 100
    },
    chunk_size: 250,
    chunk_overlap: 50,
    enable_llm_cache: true,
    enable_vector_store: true
  }
  ```

- [ ] Create `lib/lightrag/client.ts` for LightRAG wrapper:
  ```typescript
  import { LightRAG } from 'lightrag'
  import { lightragConfig } from './config'
  
  let ragInstance: LightRAG | null = null
  
  export async function getLightRAG() {
    if (!ragInstance) {
      ragInstance = new LightRAG(lightragConfig)
    }
    return ragInstance
  }
  ```

## Admin CLI Tools

### Base CLI Configuration
- [ ] Create `scripts/cli-base.ts` with shared utilities:
  ```typescript
  import chalk from 'chalk'
  import ora from 'ora'
  import dotenv from 'dotenv'
  
  dotenv.config({ path: '.env.local' })
  
  export function validateEnv() {
    const required = ['OPENAI_API_KEY', 'FIRECRAWL_API_KEY', 'POSTGRES_URL']
    const missing = required.filter(key => !process.env[key])
    
    if (missing.length > 0) {
      console.error(chalk.red(`Missing environment variables: ${missing.join(', ')}`))
      process.exit(1)
    }
  }
  
  export { chalk, ora }
  ```

### Ingestion Script
- [ ] Create `scripts/ingest.ts` for initial wiki scraping:
  ```typescript
  import { validateEnv, chalk, ora } from './cli-base'
  import { FirecrawlApp } from '@mendable/firecrawl-js'
  import { getLightRAG } from '../lib/lightrag/client'
  import crypto from 'crypto'
  
  validateEnv()
  
  async function ingestOrcaSlicerWiki() {
    const spinner = ora('Starting OrcaSlicer wiki ingestion...').start()
    
    try {
      // Initialize Firecrawl
      const firecrawl = new FirecrawlApp({ 
        apiKey: process.env.FIRECRAWL_API_KEY 
      })
      
      spinner.text = 'Crawling OrcaSlicer wiki...'
      
      // Crawl configuration
      const crawlResult = await firecrawl.crawlUrl(
        'https://github.com/SoftFever/OrcaSlicer/wiki',
        {
          crawlerOptions: {
            includes: ['*/wiki/*'],
            excludes: ['*/edit/*', '*/history/*', '*/_history'],
            limit: 500,
            generateImgAltText: true
          },
          pageOptions: {
            onlyMainContent: true,
            includeHtml: false,
            screenshot: false,
            waitFor: 1000
          }
        }
      )
      
      spinner.text = `Processing ${crawlResult.data.length} documents...`
      
      // Initialize LightRAG
      const rag = await getLightRAG()
      
      // Process and insert documents
      for (const doc of crawlResult.data) {
        const docHash = crypto
          .createHash('sha256')
          .update(doc.markdown)
          .digest('hex')
        
        // Store metadata
        const metadata = {
          url: doc.url,
          title: doc.metadata?.title || 'Untitled',
          sourceType: 'wiki',
          crawledAt: new Date().toISOString(),
          docHash
        }
        
        // Insert into LightRAG
        await rag.insert(doc.markdown, metadata)
      }
      
      spinner.succeed(chalk.green(`✓ Ingested ${crawlResult.data.length} documents`))
      
      // Show summary
      console.log(chalk.blue('\n📊 Ingestion Summary:'))
      console.log(`  • Documents processed: ${crawlResult.data.length}`)
      console.log(`  • Knowledge base location: ./knowledge-base`)
      console.log(`  • Next step: Run 'pnpm kb:stats' to verify`)
      
    } catch (error) {
      spinner.fail(chalk.red('Ingestion failed'))
      console.error(error)
      process.exit(1)
    }
  }
  
  ingestOrcaSlicerWiki()
  ```

### Add Content Script
- [ ] Create `scripts/add.ts` for incremental updates:
  ```typescript
  import { program } from 'commander'
  import { validateEnv, chalk, ora } from './cli-base'
  import { FirecrawlApp } from '@mendable/firecrawl-js'
  import { getLightRAG } from '../lib/lightrag/client'
  import fs from 'fs/promises'
  import path from 'path'
  
  validateEnv()
  
  program
    .name('kb:add')
    .description('Add content to OrcaSlicer knowledge base')
    .option('-u, --url <url>', 'Add content from URL')
    .option('-f, --file <path>', 'Add content from markdown file')
    .option('-d, --dir <path>', 'Add all .md files from directory')
    .option('-t, --type <type>', 'Content type (wiki|guide|issue)', 'guide')
    .parse()
  
  const options = program.opts()
  
  async function addContent() {
    if (!options.url && !options.file && !options.dir) {
      console.error(chalk.red('Error: Must specify --url, --file, or --dir'))
      program.help()
      process.exit(1)
    }
    
    const spinner = ora('Processing content...').start()
    
    try {
      const rag = await getLightRAG()
      let contentToAdd: Array<{ content: string, metadata: any }> = []
      
      // Handle URL
      if (options.url) {
        spinner.text = `Fetching ${options.url}...`
        const firecrawl = new FirecrawlApp({ 
          apiKey: process.env.FIRECRAWL_API_KEY 
        })
        
        const result = await firecrawl.scrapeUrl(options.url, {
          pageOptions: { onlyMainContent: true }
        })
        
        contentToAdd.push({
          content: result.markdown,
          metadata: {
            url: options.url,
            title: result.metadata?.title || 'Untitled',
            sourceType: options.type,
            addedAt: new Date().toISOString()
          }
        })
      }
      
      // Handle single file
      else if (options.file) {
        spinner.text = `Reading ${options.file}...`
        const content = await fs.readFile(options.file, 'utf-8')
        const fileName = path.basename(options.file, '.md')
        
        contentToAdd.push({
          content,
          metadata: {
            fileName: options.file,
            title: fileName,
            sourceType: options.type,
            addedAt: new Date().toISOString()
          }
        })
      }
      
      // Handle directory
      else if (options.dir) {
        spinner.text = `Scanning directory ${options.dir}...`
        const files = await fs.readdir(options.dir)
        const mdFiles = files.filter(f => f.endsWith('.md'))
        
        for (const file of mdFiles) {
          const filePath = path.join(options.dir, file)
          const content = await fs.readFile(filePath, 'utf-8')
          
          contentToAdd.push({
            content,
            metadata: {
              fileName: filePath,
              title: path.basename(file, '.md'),
              sourceType: options.type,
              addedAt: new Date().toISOString()
            }
          })
        }
      }
      
      // Insert all content
      spinner.text = 'Updating knowledge graph...'
      
      for (const item of contentToAdd) {
        await rag.insert(item.content, item.metadata)
      }
      
      spinner.succeed(chalk.green(`✓ Added ${contentToAdd.length} document(s)`))
      
    } catch (error) {
      spinner.fail(chalk.red('Failed to add content'))
      console.error(error)
      process.exit(1)
    }
  }
  
  addContent()
  ```

### Statistics Script
- [ ] Create `scripts/stats.ts` for knowledge base statistics:
  ```typescript
  import { validateEnv, chalk } from './cli-base'
  import { getLightRAG } from '../lib/lightrag/client'
  import fs from 'fs/promises'
  import path from 'path'
  import Table from 'cli-table3'
  
  validateEnv()
  
  async function showStats() {
    try {
      console.log(chalk.bold('\n📊 OrcaSlicer Knowledge Base Statistics\n'))
      
      const kbPath = './knowledge-base'
      
      // Check if knowledge base exists
      try {
        await fs.access(kbPath)
      } catch {
        console.error(chalk.red('❌ Knowledge base not found. Run "pnpm kb:ingest" first.'))
        process.exit(1)
      }
      
      // File statistics
      const files = await fs.readdir(kbPath)
      const table = new Table({
        head: ['File', 'Size', 'Modified'],
        colWidths: [40, 15, 25]
      })
      
      let totalSize = 0
      
      for (const file of files) {
        const filePath = path.join(kbPath, file)
        const stat = await fs.stat(filePath)
        totalSize += stat.size
        
        table.push([
          file.substring(0, 37) + (file.length > 37 ? '...' : ''),
          `${(stat.size / 1024).toFixed(2)} KB`,
          stat.mtime.toLocaleString()
        ])
      }
      
      console.log(table.toString())
      console.log(chalk.yellow(`\nTotal size: ${(totalSize / 1024 / 1024).toFixed(2)} MB`))
      console.log(chalk.yellow(`Total files: ${files.length}`))
      
      // Test query performance
      console.log(chalk.blue('\n🔍 Testing query performance...\n'))
      
      const rag = await getLightRAG()
      const testQueries = [
        'how to calibrate flow rate',
        'temperature tower settings',
        'retraction test procedure'
      ]
      
      const perfTable = new Table({
        head: ['Query', 'Time (ms)', 'Status'],
        colWidths: [40, 15, 10]
      })
      
      for (const query of testQueries) {
        const start = Date.now()
        try {
          await rag.query(query, { mode: 'hybrid', top_k: 3 })
          const duration = Date.now() - start
          perfTable.push([
            query,
            duration.toString(),
            chalk.green('✓')
          ])
        } catch (error) {
          perfTable.push([
            query,
            'N/A',
            chalk.red('✗')
          ])
        }
      }
      
      console.log(perfTable.toString())
      
    } catch (error) {
      console.error(chalk.red('Error getting statistics:'), error)
      process.exit(1)
    }
  }
  
  showStats()
  ```

### Backup Script
- [ ] Create `scripts/backup.ts` for knowledge base backups:
  ```typescript
  import { validateEnv, chalk, ora } from './cli-base'
  import fs from 'fs/promises'
  import path from 'path'
  import { execSync } from 'child_process'
  
  async function backupKnowledgeBase() {
    const spinner = ora('Creating backup...').start()
    
    try {
      const timestamp = new Date().toISOString().replace(/:/g, '-').split('.')[0]
      const backupDir = `backups/kb-backup-${timestamp}`
      
      // Create backup directory
      await fs.mkdir(path.dirname(backupDir), { recursive: true })
      
      // Copy knowledge base
      spinner.text = 'Copying knowledge base files...'
      execSync(`cp -r ./knowledge-base ${backupDir}`)
      
      // Create backup metadata
      const metadata = {
        timestamp,
        version: '1.0.0',
        files: await fs.readdir('./knowledge-base')
      }
      
      await fs.writeFile(
        path.join(backupDir, 'backup-metadata.json'),
        JSON.stringify(metadata, null, 2)
      )
      
      // Compress backup
      spinner.text = 'Compressing backup...'
      execSync(`tar -czf ${backupDir}.tar.gz -C ${path.dirname(backupDir)} ${path.basename(backupDir)}`)
      
      // Clean up uncompressed backup
      execSync(`rm -rf ${backupDir}`)
      
      spinner.succeed(chalk.green(`✓ Backup created: ${backupDir}.tar.gz`))
      
    } catch (error) {
      spinner.fail(chalk.red('Backup failed'))
      console.error(error)
      process.exit(1)
    }
  }
  
  backupKnowledgeBase()
  ```

## API Routes

### Chat API Route
- [ ] Create `app/api/chat/route.ts`:
  ```typescript
  import { NextRequest } from 'next/server'
  import { OpenAI } from 'openai'
  import { getLightRAG } from '@/lib/lightrag/client'
  import { z } from 'zod'
  import { streamText } from 'ai'
  import { openai } from '@ai-sdk/openai'
  
  const requestSchema = z.object({
    messages: z.array(z.object({
      role: z.enum(['user', 'assistant', 'system']),
      content: z.string()
    }))
  })
  
  export async function POST(req: NextRequest) {
    try {
      const body = await req.json()
      const { messages } = requestSchema.parse(body)
      
      // Get the last user message
      const lastMessage = messages[messages.length - 1].content
      
      // Query LightRAG for context
      const rag = await getLightRAG()
      const context = await rag.query(lastMessage, {
        mode: 'hybrid',
        top_k: 5,
        score_threshold: 0.7
      })
      
      // System prompt with context
      const systemPrompt = `You are an expert assistant for OrcaSlicer, a 3D printing slicer software. 
      You provide accurate, helpful information about calibration, settings, and troubleshooting.
      
      Use the following context to answer questions:
      ${context}
      
      Important guidelines:
      - Be specific and reference exact settings when possible
      - Provide step-by-step instructions for procedures
      - Mention relevant calibration tests when appropriate
      - If unsure, acknowledge limitations rather than guessing`
      
      // Stream response
      const result = await streamText({
        model: openai('gpt-4-turbo-preview'),
        messages: [
          { role: 'system', content: systemPrompt },
          ...messages
        ],
        temperature: 0.3,
        maxTokens: 2000,
      })
      
      return result.toAIStreamResponse()
      
    } catch (error) {
      console.error('Chat API error:', error)
      
      if (error instanceof z.ZodError) {
        return new Response(JSON.stringify({ error: 'Invalid request format' }), {
          status: 400,
          headers: { 'Content-Type': 'application/json' }
        })
      }
      
      return new Response(JSON.stringify({ error: 'Internal server error' }), {
        status: 500,
        headers: { 'Content-Type': 'application/json' }
      })
    }
  }
  ```

### Health Check Route
- [ ] Create `app/api/health/route.ts`:
  ```typescript
  import { NextResponse } from 'next/server'
  import { sql } from '@vercel/postgres'
  import { getLightRAG } from '@/lib/lightrag/client'
  
  export async function GET() {
    const checks = {
      database: 'unknown',
      lightrag: 'unknown',
      timestamp: new Date().toISOString()
    }
    
    try {
      // Check database
      await sql`SELECT 1`
      checks.database = 'healthy'
    } catch (error) {
      checks.database = 'unhealthy'
    }
    
    try {
      // Check LightRAG
      const rag = await getLightRAG()
      await rag.query('test', { mode: 'naive', top_k: 1 })
      checks.lightrag = 'healthy'
    } catch (error) {
      checks.lightrag = 'unhealthy'
    }
    
    const status = checks.database === 'healthy' && checks.lightrag === 'healthy' ? 200 : 503
    
    return NextResponse.json(checks, { status })
  }
  ```

## Frontend Components

### Chat Interface Component
- [ ] Create `components/chat/ChatInterface.tsx`:
  ```typescript
  'use client'
  
  import { useState, useRef, useEffect } from 'react'
  import { useChat } from 'ai/react'
  import { Button } from '@/components/ui/button'
  import { Textarea } from '@/components/ui/textarea'
  import { Send, Loader2 } from 'lucide-react'
  
  export function ChatInterface() {
    const { messages, input, handleInputChange, handleSubmit, isLoading } = useChat({
      api: '/api/chat',
    })
    
    const messagesEndRef = useRef<HTMLDivElement>(null)
    
    const scrollToBottom = () => {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
    }
    
    useEffect(() => {
      scrollToBottom()
    }, [messages])
    
    return (
      <div className="flex flex-col h-full">
        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {messages.length === 0 && (
            <div className="text-center text-gray-500 mt-8">
              <h2 className="text-2xl font-bold mb-4">OrcaSlicer Assistant</h2>
              <p>Ask me anything about OrcaSlicer calibration, settings, or troubleshooting!</p>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-8 max-w-2xl mx-auto">
                <button
                  onClick={() => handleInputChange({ target: { value: 'How do I calibrate flow rate?' } } as any)}
                  className="text-left p-4 border rounded-lg hover:bg-gray-50"
                >
                  <div className="font-semibold">Flow Rate Calibration</div>
                  <div className="text-sm text-gray-600">Learn the proper procedure</div>
                </button>
                
                <button
                  onClick={() => handleInputChange({ target: { value: 'What are the best retraction settings?' } } as any)}
                  className="text-left p-4 border rounded-lg hover:bg-gray-50"
                >
                  <div className="font-semibold">Retraction Settings</div>
                  <div className="text-sm text-gray-600">Optimize stringing prevention</div>
                </button>
                
                <button
                  onClick={() => handleInputChange({ target: { value: 'How to use temperature towers?' } } as any)}
                  className="text-left p-4 border rounded-lg hover:bg-gray-50"
                >
                  <div className="font-semibold">Temperature Towers</div>
                  <div className="text-sm text-gray-600">Find optimal print temperature</div>
                </button>
                
                <button
                  onClick={() => handleInputChange({ target: { value: 'Explain pressure advance calibration' } } as any)}
                  className="text-left p-4 border rounded-lg hover:bg-gray-50"
                >
                  <div className="font-semibold">Pressure Advance</div>
                  <div className="text-sm text-gray-600">Improve corner quality</div>
                </button>
              </div>
            </div>
          )}
          
          {messages.map((message) => (
            <div
              key={message.id}
              className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
            >
              <div
                className={`max-w-[80%] rounded-lg p-4 ${
                  message.role === 'user'
                    ? 'bg-blue-500 text-white'
                    : 'bg-gray-100 text-gray-900'
                }`}
              >
                <div className="prose prose-sm max-w-none">
                  {message.content}
                </div>
              </div>
            </div>
          ))}
          
          {isLoading && (
            <div className="flex justify-start">
              <div className="bg-gray-100 rounded-lg p-4">
                <Loader2 className="w-5 h-5 animate-spin" />
              </div>
            </div>
          )}
          
          <div ref={messagesEndRef} />
        </div>
        
        <form onSubmit={handleSubmit} className="border-t p-4">
          <div className="flex gap-2">
            <Textarea
              value={input}
              onChange={handleInputChange}
              placeholder="Ask about OrcaSlicer calibration, settings, or troubleshooting..."
              className="flex-1"
              rows={2}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault()
                  handleSubmit(e as any)
                }
              }}
            />
            <Button type="submit" disabled={isLoading || !input.trim()}>
              {isLoading ? (
                <Loader2 className="w-5 h-5 animate-spin" />
              ) : (
                <Send className="w-5 h-5" />
              )}
            </Button>
          </div>
        </form>
      </div>
    )
  }
  ```

### Main Layout
- [ ] Create `app/layout.tsx`:
  ```typescript
  import type { Metadata } from 'next'
  import { Inter } from 'next/font/google'
  import './globals.css'
  
  const inter = Inter({ subsets: ['latin'] })
  
  export const metadata: Metadata = {
    title: 'OrcaSlicer Assistant',
    description: 'AI-powered assistant for OrcaSlicer calibration and troubleshooting',
  }
  
  export default function RootLayout({
    children,
  }: {
    children: React.ReactNode
  }) {
    return (
      <html lang="en">
        <body className={inter.className}>
          <div className="min-h-screen bg-gray-50">
            <header className="bg-white shadow-sm border-b">
              <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
                <h1 className="text-2xl font-bold text-gray-900">
                  OrcaSlicer Assistant
                </h1>
              </div>
            </header>
            <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
              {children}
            </main>
          </div>
        </body>
      </html>
    )
  }
  ```

### Home Page
- [ ] Create `app/page.tsx`:
  ```typescript
  import { ChatInterface } from '@/components/chat/ChatInterface'
  
  export default function Home() {
    return (
      <div className="bg-white rounded-lg shadow-lg h-[calc(100vh-12rem)]">
        <ChatInterface />
      </div>
    )
  }
  ```

## Utility Functions

### Text Processing Utilities
- [ ] Create `lib/utils/text-processing.ts`:
  ```typescript
  import crypto from 'crypto'
  
  export function chunkText(text: string, options = {
    maxChunkSize: 250,
    overlap: 50,
    preserveCodeBlocks: true
  }) {
    const chunks: Array<{ content: string; metadata: any }> = []
    
    // Split by major sections first
    const sections = text.split(/\n(?=#{1,3}\s)/)
    
    for (const section of sections) {
      // Extract section title
      const titleMatch = section.match(/^(#{1,3})\s+(.+)/)
      const sectionTitle = titleMatch ? titleMatch[2] : 'Untitled Section'
      const sectionLevel = titleMatch ? titleMatch[1].length : 0
      
      // Handle code blocks specially
      if (options.preserveCodeBlocks) {
        const parts = section.split(/(```[\s\S]*?```)/g)
        
        for (let i = 0; i < parts.length; i++) {
          const part = parts[i]
          
          if (part.startsWith('```')) {
            // This is a code block, keep it intact
            chunks.push({
              content: part,
              metadata: {
                type: 'code',
                sectionTitle,
                sectionLevel
              }
            })
          } else {
            // Regular text, chunk it
            const sentences = part.split(/(?<=[.!?])\s+/)
            let currentChunk = ''
            
            for (const sentence of sentences) {
              if ((currentChunk + sentence).length > options.maxChunkSize && currentChunk) {
                chunks.push({
                  content: currentChunk.trim(),
                  metadata: {
                    type: 'text',
                    sectionTitle,
                    sectionLevel
                  }
                })
                
                // Start new chunk with overlap
                const overlap = currentChunk.split(' ').slice(-options.overlap).join(' ')
                currentChunk = overlap + ' ' + sentence
              } else {
                currentChunk += ' ' + sentence
              }
            }
            
            if (currentChunk.trim()) {
              chunks.push({
                content: currentChunk.trim(),
                metadata: {
                  type: 'text',
                  sectionTitle,
                  sectionLevel
                }
              })
            }
          }
        }
      }
    }
    
    return chunks
  }
  
  export function generateDocHash(content: string): string {
    return crypto.createHash('sha256').update(content).digest('hex')
  }
  
  export function extractMetadata(markdown: string): Record<string, any> {
    const metadata: Record<string, any> = {}
    
    // Extract title
    const titleMatch = markdown.match(/^#\s+(.+)/m)
    if (titleMatch) {
      metadata.title = titleMatch[1]
    }
    
    // Extract all headers for hierarchy
    const headers = [...markdown.matchAll(/^(#{1,6})\s+(.+)/gm)]
    metadata.headers = headers.map(([_, level, text]) => ({
      level: level.length,
      text
    }))
    
    // Count code blocks
    const codeBlocks = [...markdown.matchAll(/```/g)]
    metadata.codeBlockCount = Math.floor(codeBlocks.length / 2)
    
    // Detect content type
    if (markdown.includes('calibration') || markdown.includes('Calibration')) {
      metadata.contentType = 'calibration'
    } else if (markdown.includes('troubleshoot') || markdown.includes('issue')) {
      metadata.contentType = 'troubleshooting'
    } else {
      metadata.contentType = 'general'
    }
    
    return metadata
  }
  ```

### Rate Limiting
- [ ] Create `lib/utils/rate-limit.ts`:
  ```typescript
  const rateLimit = new Map<string, { count: number; resetAt: number }>()
  
  export function checkRateLimit(
    identifier: string,
    limit: number = 10,
    windowMs: number = 60000
  ): { allowed: boolean; resetIn?: number } {
    const now = Date.now()
    const userLimit = rateLimit.get(identifier)
    
    if (!userLimit || now > userLimit.resetAt) {
      rateLimit.set(identifier, {
        count: 1,
        resetAt: now + windowMs
      })
      return { allowed: true }
    }
    
    if (userLimit.count >= limit) {
      return {
        allowed: false,
        resetIn: Math.ceil((userLimit.resetAt - now) / 1000)
      }
    }
    
    userLimit.count++
    return { allowed: true }
  }
  ```

## Package.json Scripts
- [ ] Update `package.json` with all CLI scripts:
  ```json
  {
    "scripts": {
      "dev": "next dev",
      "build": "next build",
      "start": "next start",
      "lint": "next lint",
      "kb:ingest": "tsx scripts/ingest.ts",
      "kb:add": "tsx scripts/add.ts",
      "kb:stats": "tsx scripts/stats.ts",
      "kb:backup": "tsx scripts/backup.ts",
      "db:setup": "tsx scripts/setup-database.ts",
      "db:migrate": "drizzle-kit migrate"
    }
  }
  ```

## Error Handling and Monitoring

### Global Error Handler
- [ ] Create `lib/utils/error-handler.ts`:
  ```typescript
  export class ChatbotError extends Error {
    constructor(
      message: string,
      public code: string,
      public statusCode: number = 500,
      public details?: any
    ) {
      super(message)
      this.name = 'ChatbotError'
    }
  }
  
  export function handleApiError(error: unknown): Response {
    console.error('API Error:', error)
    
    if (error instanceof ChatbotError) {
      return new Response(
        JSON.stringify({
          error: error.message,
          code: error.code,
          details: error.details
        }),
        {
          status: error.statusCode,
          headers: { 'Content-Type': 'application/json' }
        }
      )
    }
    
    if (error instanceof Error) {
      // Check for specific error types
      if (error.message.includes('rate limit')) {
        return new Response(
          JSON.stringify({
            error: 'Too many requests. Please try again later.',
            code: 'RATE_LIMITED'
          }),
          {
            status: 429,
            headers: { 'Content-Type': 'application/json' }
          }
        )
      }
      
      if (error.message.includes('OPENAI')) {
        return new Response(
          JSON.stringify({
            error: 'AI service temporarily unavailable',
            code: 'AI_SERVICE_ERROR'
          }),
          {
            status: 503,
            headers: { 'Content-Type': 'application/json' }
          }
        )
      }
    }
    
    return new Response(
      JSON.stringify({
        error: 'An unexpected error occurred',
        code: 'INTERNAL_ERROR'
      }),
      {
        status: 500,
        headers: { 'Content-Type': 'application/json' }
      }
    )
  }
  ```

### Request Logging Middleware
- [ ] Create `lib/middleware/logging.ts`:
  ```typescript
  export async function logRequest(
    request: Request,
    handler: () => Promise<Response>
  ): Promise<Response> {
    const start = Date.now()
    const requestId = crypto.randomUUID()
    
    console.log({
      type: 'request',
      requestId,
      method: request.method,
      url: request.url,
      timestamp: new Date().toISOString()
    })
    
    try {
      const response = await handler()
      const duration = Date.now() - start
      
      console.log({
        type: 'response',
        requestId,
        status: response.status,
        duration,
        timestamp: new Date().toISOString()
      })
      
      return response
    } catch (error) {
      const duration = Date.now() - start
      
      console.error({
        type: 'error',
        requestId,
        error: error instanceof Error ? error.message : 'Unknown error',
        duration,
        timestamp: new Date().toISOString()
      })
      
      throw error
    }
  }
  ```

## Testing Setup

### Unit Tests Configuration
- [ ] Create `jest.config.js`:
  ```javascript
  module.exports = {
    preset: 'ts-jest',
    testEnvironment: 'node',
    roots: ['<rootDir>/tests'],
    testMatch: ['**/*.test.ts'],
    collectCoverageFrom: [
      'lib/**/*.ts',
      'scripts/**/*.ts',
      '!**/*.d.ts',
    ],
  }
  ```

### Integration Tests
- [ ] Create `tests/integration/chat-api.test.ts`:
  ```typescript
  import { POST } from '@/app/api/chat/route'
  import { NextRequest } from 'next/server'
  
  describe('Chat API', () => {
    it('should respond to valid requests', async () => {
      const request = new NextRequest('http://localhost:3000/api/chat', {
        method: 'POST',
        body: JSON.stringify({
          messages: [
            { role: 'user', content: 'How do I calibrate flow rate?' }
          ]
        })
      })
      
      const response = await POST(request)
      expect(response.status).toBe(200)
    })
    
    it('should handle invalid requests', async () => {
      const request = new NextRequest('http://localhost:3000/api/chat', {
        method: 'POST',
        body: JSON.stringify({ invalid: 'data' })
      })
      
      const response = await POST(request)
      expect(response.status).toBe(400)
    })
  })
  ```

## Deployment Configuration

### Vercel Configuration
- [ ] Create `vercel.json`:
  ```json
  {
    "functions": {
      "app/api/chat/route.ts": {
        "maxDuration": 30
      }
    },
    "env": {
      "OPENAI_API_KEY": "@openai-api-key",
      "POSTGRES_URL": "@postgres-url"
    },
    "buildCommand": "pnpm build",
    "installCommand": "pnpm install",
    "framework": "nextjs"
  }
  ```

### Environment Variables Setup
- [ ] Configure Vercel environment variables through dashboard:
  - OPENAI_API_KEY (production)
  - POSTGRES_URL (production)
  - POSTGRES_PRISMA_URL (production)
  - POSTGRES_URL_NO_SSL (production)
  - POSTGRES_URL_NON_POOLING (production)
  - POSTGRES_USER (production)
  - POSTGRES_HOST (production)
  - POSTGRES_PASSWORD (production)
  - POSTGRES_DATABASE (production)

### GitHub Actions Deployment
- [ ] Create `.github/workflows/deploy.yml`:
  ```yaml
  name: Deploy to Vercel
  
  on:
    push:
      branches: [main]
    pull_request:
      branches: [main]
  
  jobs:
    deploy:
      runs-on: ubuntu-latest
      
      steps:
        - uses: actions/checkout@v3
        
        - name: Setup Node.js
          uses: actions/setup-node@v3
          with:
            node-version: '20'
            
        - name: Install pnpm
          uses: pnpm/action-setup@v2
          with:
            version: 8
            
        - name: Install dependencies
          run: pnpm install
          
        - name: Run tests
          run: pnpm test
          
        - name: Build
          run: pnpm build
          
        - name: Deploy to Vercel
          uses: amondnet/vercel-action@v25
          with:
            vercel-token: ${{ secrets.VERCEL_TOKEN }}
            vercel-org-id: ${{ secrets.VERCEL_ORG_ID }}
            vercel-project-id: ${{ secrets.VERCEL_PROJECT_ID }}
  ```

## Documentation

### README.md
- [ ] Create comprehensive `README.md`:
  ```markdown
  # OrcaSlicer Assistant
  
  AI-powered assistant for OrcaSlicer calibration and troubleshooting.
  
  ## Features
  - Comprehensive knowledge base from OrcaSlicer wiki
  - Real-time chat interface
  - Contextual answers using LightRAG
  - Terminal-based admin tools
  
  ## Setup
  
  1. Clone repository
  2. Install dependencies: `pnpm install`
  3. Set up environment variables in `.env.local`
  4. Initialize database: `pnpm db:setup`
  5. Ingest documentation: `pnpm kb:ingest`
  6. Start development server: `pnpm dev`
  
  ## Admin Commands
  
  - `pnpm kb:ingest` - Initial wiki ingestion
  - `pnpm kb:add --url <url>` - Add new documentation
  - `pnpm kb:stats` - View knowledge base statistics
  - `pnpm kb:backup` - Create backup
  
  ## Deployment
  
  Deploy to Vercel with one click:
  
  [![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=https://github.com/yourusername/orcaslicer-assistant)
  ```

### Admin Documentation
- [ ] Create `docs/ADMIN.md`:
  ```markdown
  # Admin Guide
  
  ## Knowledge Base Management
  
  ### Initial Setup
  1. Run `pnpm kb:ingest` to scrape OrcaSlicer wiki
  2. Verify with `pnpm kb:stats`
  
  ### Adding Content
  
  From URL:
  ```bash
  pnpm kb:add --url "https://example.com/guide" --type guide
  ```
  
  From file:
  ```bash
  pnpm kb:add --file "./docs/custom-guide.md" --type guide
  ```
  
  From directory:
  ```bash
  pnpm kb:add --dir "./additional-docs" --type wiki
  ```
  
  ### Maintenance
  
  Regular backups:
  ```bash
  # Create backup
  pnpm kb:backup
  
  # Restore from backup
  tar -xzf backups/kb-backup-2025-01-15.tar.gz
  cp -r kb-backup-2025-01-15/* ./knowledge-base/
  ```
  ```

## Final Setup Steps

### Git Configuration
- [ ] Create `.gitignore` if not exists
- [ ] Initialize git repository: `git init`
- [ ] Make initial commit: `git add . && git commit -m "Initial commit"`

### Vercel Deployment
- [ ] Install Vercel CLI: `npm i -g vercel`
- [ ] Link to Vercel project: `vercel link`
- [ ] Deploy to preview: `vercel`
- [ ] Deploy to production: `vercel --prod`

### Post-Deployment Verification
- [ ] Test chat interface at production URL
- [ ] Verify rate limiting is working
- [ ] Check error handling with invalid inputs
- [ ] Monitor initial user queries
- [ ] Set up alerts for errors



# For creating the ChatBot component in react use the following:

You are given a task to integrate an existing React component in the codebase

The codebase should support:
- shadcn project structure  
- Tailwind CSS
- Typescript

If it doesn't, provide instructions on how to setup project via shadcn CLI, install Tailwind or Typescript.

Determine the default path for components and styles. 
If default path for components is not /components/ui, provide instructions on why it's important to create this folder
Copy-paste this component to /components/ui folder:
```tsx
animated-ai-chat.tsx
"use client";

import { useEffect, useRef, useCallback, useTransition } from "react";
import { useState } from "react";
import { cn } from "@/lib/utils";
import {
    ImageIcon,
    FileUp,
    Figma,
    MonitorIcon,
    CircleUserRound,
    ArrowUpIcon,
    Paperclip,
    PlusIcon,
    SendIcon,
    XIcon,
    LoaderIcon,
    Sparkles,
    Command,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import * as React from "react"

interface UseAutoResizeTextareaProps {
    minHeight: number;
    maxHeight?: number;
}

function useAutoResizeTextarea({
    minHeight,
    maxHeight,
}: UseAutoResizeTextareaProps) {
    const textareaRef = useRef<HTMLTextAreaElement>(null);

    const adjustHeight = useCallback(
        (reset?: boolean) => {
            const textarea = textareaRef.current;
            if (!textarea) return;

            if (reset) {
                textarea.style.height = `${minHeight}px`;
                return;
            }

            textarea.style.height = `${minHeight}px`;
            const newHeight = Math.max(
                minHeight,
                Math.min(
                    textarea.scrollHeight,
                    maxHeight ?? Number.POSITIVE_INFINITY
                )
            );

            textarea.style.height = `${newHeight}px`;
        },
        [minHeight, maxHeight]
    );

    useEffect(() => {
        const textarea = textareaRef.current;
        if (textarea) {
            textarea.style.height = `${minHeight}px`;
        }
    }, [minHeight]);

    useEffect(() => {
        const handleResize = () => adjustHeight();
        window.addEventListener("resize", handleResize);
        return () => window.removeEventListener("resize", handleResize);
    }, [adjustHeight]);

    return { textareaRef, adjustHeight };
}

interface CommandSuggestion {
    icon: React.ReactNode;
    label: string;
    description: string;
    prefix: string;
}

interface TextareaProps
  extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  containerClassName?: string;
  showRing?: boolean;
}

const Textarea = React.forwardRef<HTMLTextAreaElement, TextareaProps>(
  ({ className, containerClassName, showRing = true, ...props }, ref) => {
    const [isFocused, setIsFocused] = React.useState(false);
    
    return (
      <div className={cn(
        "relative",
        containerClassName
      )}>
        <textarea
          className={cn(
            "flex min-h-[80px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm",
            "transition-all duration-200 ease-in-out",
            "placeholder:text-muted-foreground",
            "disabled:cursor-not-allowed disabled:opacity-50",
            showRing ? "focus-visible:outline-none focus-visible:ring-0 focus-visible:ring-offset-0" : "",
            className
          )}
          ref={ref}
          onFocus={() => setIsFocused(true)}
          onBlur={() => setIsFocused(false)}
          {...props}
        />
        
        {showRing && isFocused && (
          <motion.span 
            className="absolute inset-0 rounded-md pointer-events-none ring-2 ring-offset-0 ring-violet-500/30"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
          />
        )}

        {props.onChange && (
          <div 
            className="absolute bottom-2 right-2 opacity-0 w-2 h-2 bg-violet-500 rounded-full"
            style={{
              animation: 'none',
            }}
            id="textarea-ripple"
          />
        )}
      </div>
    )
  }
)
Textarea.displayName = "Textarea"

export function AnimatedAIChat() {
    const [value, setValue] = useState("");
    const [attachments, setAttachments] = useState<string[]>([]);
    const [isTyping, setIsTyping] = useState(false);
    const [isPending, startTransition] = useTransition();
    const [activeSuggestion, setActiveSuggestion] = useState<number>(-1);
    const [showCommandPalette, setShowCommandPalette] = useState(false);
    const [recentCommand, setRecentCommand] = useState<string | null>(null);
    const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 });
    const { textareaRef, adjustHeight } = useAutoResizeTextarea({
        minHeight: 60,
        maxHeight: 200,
    });
    const [inputFocused, setInputFocused] = useState(false);
    const commandPaletteRef = useRef<HTMLDivElement>(null);

    const commandSuggestions: CommandSuggestion[] = [
        { 
            icon: <ImageIcon className="w-4 h-4" />, 
            label: "Clone UI", 
            description: "Generate a UI from a screenshot", 
            prefix: "/clone" 
        },
        { 
            icon: <Figma className="w-4 h-4" />, 
            label: "Import Figma", 
            description: "Import a design from Figma", 
            prefix: "/figma" 
        },
        { 
            icon: <MonitorIcon className="w-4 h-4" />, 
            label: "Create Page", 
            description: "Generate a new web page", 
            prefix: "/page" 
        },
        { 
            icon: <Sparkles className="w-4 h-4" />, 
            label: "Improve", 
            description: "Improve existing UI design", 
            prefix: "/improve" 
        },
    ];

    useEffect(() => {
        if (value.startsWith('/') && !value.includes(' ')) {
            setShowCommandPalette(true);
            
            const matchingSuggestionIndex = commandSuggestions.findIndex(
                (cmd) => cmd.prefix.startsWith(value)
            );
            
            if (matchingSuggestionIndex >= 0) {
                setActiveSuggestion(matchingSuggestionIndex);
            } else {
                setActiveSuggestion(-1);
            }
        } else {
            setShowCommandPalette(false);
        }
    }, [value]);

    useEffect(() => {
        const handleMouseMove = (e: MouseEvent) => {
            setMousePosition({ x: e.clientX, y: e.clientY });
        };

        window.addEventListener('mousemove', handleMouseMove);
        return () => {
            window.removeEventListener('mousemove', handleMouseMove);
        };
    }, []);

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            const target = event.target as Node;
            const commandButton = document.querySelector('[data-command-button]');
            
            if (commandPaletteRef.current && 
                !commandPaletteRef.current.contains(target) && 
                !commandButton?.contains(target)) {
                setShowCommandPalette(false);
            }
        };

        document.addEventListener('mousedown', handleClickOutside);
        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
        };
    }, []);

    const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
        if (showCommandPalette) {
            if (e.key === 'ArrowDown') {
                e.preventDefault();
                setActiveSuggestion(prev => 
                    prev < commandSuggestions.length - 1 ? prev + 1 : 0
                );
            } else if (e.key === 'ArrowUp') {
                e.preventDefault();
                setActiveSuggestion(prev => 
                    prev > 0 ? prev - 1 : commandSuggestions.length - 1
                );
            } else if (e.key === 'Tab' || e.key === 'Enter') {
                e.preventDefault();
                if (activeSuggestion >= 0) {
                    const selectedCommand = commandSuggestions[activeSuggestion];
                    setValue(selectedCommand.prefix + ' ');
                    setShowCommandPalette(false);
                    
                    setRecentCommand(selectedCommand.label);
                    setTimeout(() => setRecentCommand(null), 3500);
                }
            } else if (e.key === 'Escape') {
                e.preventDefault();
                setShowCommandPalette(false);
            }
        } else if (e.key === "Enter" && !e.shiftKey) {
            e.preventDefault();
            if (value.trim()) {
                handleSendMessage();
            }
        }
    };

    const handleSendMessage = () => {
        if (value.trim()) {
            startTransition(() => {
                setIsTyping(true);
                setTimeout(() => {
                    setIsTyping(false);
                    setValue("");
                    adjustHeight(true);
                }, 3000);
            });
        }
    };

    const handleAttachFile = () => {
        const mockFileName = `file-${Math.floor(Math.random() * 1000)}.pdf`;
        setAttachments(prev => [...prev, mockFileName]);
    };

    const removeAttachment = (index: number) => {
        setAttachments(prev => prev.filter((_, i) => i !== index));
    };
    
    const selectCommandSuggestion = (index: number) => {
        const selectedCommand = commandSuggestions[index];
        setValue(selectedCommand.prefix + ' ');
        setShowCommandPalette(false);
        
        setRecentCommand(selectedCommand.label);
        setTimeout(() => setRecentCommand(null), 2000);
    };

    return (
        <div className="min-h-screen flex flex-col w-full items-center justify-center bg-transparent text-white p-6 relative overflow-hidden">
        <div className="absolute inset-0 w-full h-full overflow-hidden">
                <div className="absolute top-0 left-1/4 w-96 h-96 bg-violet-500/10 rounded-full mix-blend-normal filter blur-[128px] animate-pulse" />
                <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-indigo-500/10 rounded-full mix-blend-normal filter blur-[128px] animate-pulse delay-700" />
                <div className="absolute top-1/4 right-1/3 w-64 h-64 bg-fuchsia-500/10 rounded-full mix-blend-normal filter blur-[96px] animate-pulse delay-1000" />
            </div>
            <div className="w-full max-w-2xl mx-auto relative">
                <motion.div 
                    className="relative z-10 space-y-12"
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.6, ease: "easeOut" }}
                >
                    <div className="text-center space-y-3">
                        <motion.div
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.2, duration: 0.5 }}
                            className="inline-block"
                        >
                            <h1 className="text-3xl font-medium tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-white/90 to-white/40 pb-1">
                                How can I help today?
                            </h1>
                            <motion.div 
                                className="h-px bg-gradient-to-r from-transparent via-white/20 to-transparent"
                                initial={{ width: 0, opacity: 0 }}
                                animate={{ width: "100%", opacity: 1 }}
                                transition={{ delay: 0.5, duration: 0.8 }}
                            />
                        </motion.div>
                        <motion.p 
                            className="text-sm text-white/40"
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            transition={{ delay: 0.3 }}
                        >
                            Type a command or ask a question
                        </motion.p>
                    </div>

                    <motion.div 
                        className="relative backdrop-blur-2xl bg-white/[0.02] rounded-2xl border border-white/[0.05] shadow-2xl"
                        initial={{ scale: 0.98 }}
                        animate={{ scale: 1 }}
                        transition={{ delay: 0.1 }}
                    >
                        <AnimatePresence>
                            {showCommandPalette && (
                                <motion.div 
                                    ref={commandPaletteRef}
                                    className="absolute left-4 right-4 bottom-full mb-2 backdrop-blur-xl bg-black/90 rounded-lg z-50 shadow-lg border border-white/10 overflow-hidden"
                                    initial={{ opacity: 0, y: 5 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    exit={{ opacity: 0, y: 5 }}
                                    transition={{ duration: 0.15 }}
                                >
                                    <div className="py-1 bg-black/95">
                                        {commandSuggestions.map((suggestion, index) => (
                                            <motion.div
                                                key={suggestion.prefix}
                                                className={cn(
                                                    "flex items-center gap-2 px-3 py-2 text-xs transition-colors cursor-pointer",
                                                    activeSuggestion === index 
                                                        ? "bg-white/10 text-white" 
                                                        : "text-white/70 hover:bg-white/5"
                                                )}
                                                onClick={() => selectCommandSuggestion(index)}
                                                initial={{ opacity: 0 }}
                                                animate={{ opacity: 1 }}
                                                transition={{ delay: index * 0.03 }}
                                            >
                                                <div className="w-5 h-5 flex items-center justify-center text-white/60">
                                                    {suggestion.icon}
                                                </div>
                                                <div className="font-medium">{suggestion.label}</div>
                                                <div className="text-white/40 text-xs ml-1">
                                                    {suggestion.prefix}
                                                </div>
                                            </motion.div>
                                        ))}
                                    </div>
                                </motion.div>
                            )}
                        </AnimatePresence>

                        <div className="p-4">
                            <Textarea
                                ref={textareaRef}
                                value={value}
                                onChange={(e) => {
                                    setValue(e.target.value);
                                    adjustHeight();
                                }}
                                onKeyDown={handleKeyDown}
                                onFocus={() => setInputFocused(true)}
                                onBlur={() => setInputFocused(false)}
                                placeholder="Ask zap a question..."
                                containerClassName="w-full"
                                className={cn(
                                    "w-full px-4 py-3",
                                    "resize-none",
                                    "bg-transparent",
                                    "border-none",
                                    "text-white/90 text-sm",
                                    "focus:outline-none",
                                    "placeholder:text-white/20",
                                    "min-h-[60px]"
                                )}
                                style={{
                                    overflow: "hidden",
                                }}
                                showRing={false}
                            />
                        </div>

                        <AnimatePresence>
                            {attachments.length > 0 && (
                                <motion.div 
                                    className="px-4 pb-3 flex gap-2 flex-wrap"
                                    initial={{ opacity: 0, height: 0 }}
                                    animate={{ opacity: 1, height: "auto" }}
                                    exit={{ opacity: 0, height: 0 }}
                                >
                                    {attachments.map((file, index) => (
                                        <motion.div
                                            key={index}
                                            className="flex items-center gap-2 text-xs bg-white/[0.03] py-1.5 px-3 rounded-lg text-white/70"
                                            initial={{ opacity: 0, scale: 0.9 }}
                                            animate={{ opacity: 1, scale: 1 }}
                                            exit={{ opacity: 0, scale: 0.9 }}
                                        >
                                            <span>{file}</span>
                                            <button 
                                                onClick={() => removeAttachment(index)}
                                                className="text-white/40 hover:text-white transition-colors"
                                            >
                                                <XIcon className="w-3 h-3" />
                                            </button>
                                        </motion.div>
                                    ))}
                                </motion.div>
                            )}
                        </AnimatePresence>

                        <div className="p-4 border-t border-white/[0.05] flex items-center justify-between gap-4">
                            <div className="flex items-center gap-3">
                                <motion.button
                                    type="button"
                                    onClick={handleAttachFile}
                                    whileTap={{ scale: 0.94 }}
                                    className="p-2 text-white/40 hover:text-white/90 rounded-lg transition-colors relative group"
                                >
                                    <Paperclip className="w-4 h-4" />
                                    <motion.span
                                        className="absolute inset-0 bg-white/[0.05] rounded-lg opacity-0 group-hover:opacity-100 transition-opacity"
                                        layoutId="button-highlight"
                                    />
                                </motion.button>
                                <motion.button
                                    type="button"
                                    data-command-button
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        setShowCommandPalette(prev => !prev);
                                    }}
                                    whileTap={{ scale: 0.94 }}
                                    className={cn(
                                        "p-2 text-white/40 hover:text-white/90 rounded-lg transition-colors relative group",
                                        showCommandPalette && "bg-white/10 text-white/90"
                                    )}
                                >
                                    <Command className="w-4 h-4" />
                                    <motion.span
                                        className="absolute inset-0 bg-white/[0.05] rounded-lg opacity-0 group-hover:opacity-100 transition-opacity"
                                        layoutId="button-highlight"
                                    />
                                </motion.button>
                            </div>
                            
                            <motion.button
                                type="button"
                                onClick={handleSendMessage}
                                whileHover={{ scale: 1.01 }}
                                whileTap={{ scale: 0.98 }}
                                disabled={isTyping || !value.trim()}
                                className={cn(
                                    "px-4 py-2 rounded-lg text-sm font-medium transition-all",
                                    "flex items-center gap-2",
                                    value.trim()
                                        ? "bg-white text-[#0A0A0B] shadow-lg shadow-white/10"
                                        : "bg-white/[0.05] text-white/40"
                                )}
                            >
                                {isTyping ? (
                                    <LoaderIcon className="w-4 h-4 animate-[spin_2s_linear_infinite]" />
                                ) : (
                                    <SendIcon className="w-4 h-4" />
                                )}
                                <span>Send</span>
                            </motion.button>
                        </div>
                    </motion.div>

                    <div className="flex flex-wrap items-center justify-center gap-2">
                        {commandSuggestions.map((suggestion, index) => (
                            <motion.button
                                key={suggestion.prefix}
                                onClick={() => selectCommandSuggestion(index)}
                                className="flex items-center gap-2 px-3 py-2 bg-white/[0.02] hover:bg-white/[0.05] rounded-lg text-sm text-white/60 hover:text-white/90 transition-all relative group"
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: index * 0.1 }}
                            >
                                {suggestion.icon}
                                <span>{suggestion.label}</span>
                                <motion.div
                                    className="absolute inset-0 border border-white/[0.05] rounded-lg"
                                    initial={false}
                                    animate={{
                                        opacity: [0, 1],
                                        scale: [0.98, 1],
                                    }}
                                    transition={{
                                        duration: 0.3,
                                        ease: "easeOut",
                                    }}
                                />
                            </motion.button>
                        ))}
                    </div>
                </motion.div>
            </div>

            <AnimatePresence>
                {isTyping && (
                    <motion.div 
                        className="fixed bottom-8 mx-auto transform -translate-x-1/2 backdrop-blur-2xl bg-white/[0.02] rounded-full px-4 py-2 shadow-lg border border-white/[0.05]"
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: 20 }}
                    >
                        <div className="flex items-center gap-3">
                            <div className="w-8 h-7 rounded-full bg-white/[0.05] flex items-center justify-center text-center">
                                <span className="text-xs font-medium text-white/90 mb-0.5">zap</span>
                            </div>
                            <div className="flex items-center gap-2 text-sm text-white/70">
                                <span>Thinking</span>
                                <TypingDots />
                            </div>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>

            {inputFocused && (
                <motion.div 
                    className="fixed w-[50rem] h-[50rem] rounded-full pointer-events-none z-0 opacity-[0.02] bg-gradient-to-r from-violet-500 via-fuchsia-500 to-indigo-500 blur-[96px]"
                    animate={{
                        x: mousePosition.x - 400,
                        y: mousePosition.y - 400,
                    }}
                    transition={{
                        type: "spring",
                        damping: 25,
                        stiffness: 150,
                        mass: 0.5,
                    }}
                />
            )}
        </div>
    );
}

function TypingDots() {
    return (
        <div className="flex items-center ml-1">
            {[1, 2, 3].map((dot) => (
                <motion.div
                    key={dot}
                    className="w-1.5 h-1.5 bg-white/90 rounded-full mx-0.5"
                    initial={{ opacity: 0.3 }}
                    animate={{ 
                        opacity: [0.3, 0.9, 0.3],
                        scale: [0.85, 1.1, 0.85]
                    }}
                    transition={{
                        duration: 1.2,
                        repeat: Infinity,
                        delay: dot * 0.15,
                        ease: "easeInOut",
                    }}
                    style={{
                        boxShadow: "0 0 4px rgba(255, 255, 255, 0.3)"
                    }}
                />
            ))}
        </div>
    );
}

interface ActionButtonProps {
    icon: React.ReactNode;
    label: string;
}

function ActionButton({ icon, label }: ActionButtonProps) {
    const [isHovered, setIsHovered] = useState(false);
    
    return (
        <motion.button
            type="button"
            whileHover={{ scale: 1.05, y: -2 }}
            whileTap={{ scale: 0.97 }}
            onHoverStart={() => setIsHovered(true)}
            onHoverEnd={() => setIsHovered(false)}
            className="flex items-center gap-2 px-4 py-2 bg-neutral-900 hover:bg-neutral-800 rounded-full border border-neutral-800 text-neutral-400 hover:text-white transition-all relative overflow-hidden group"
        >
            <div className="relative z-10 flex items-center gap-2">
                {icon}
                <span className="text-xs relative z-10">{label}</span>
            </div>
            
            <AnimatePresence>
                {isHovered && (
                    <motion.div 
                        className="absolute inset-0 bg-gradient-to-r from-violet-500/10 to-indigo-500/10"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        transition={{ duration: 0.2 }}
                    />
                )}
            </AnimatePresence>
            
            <motion.span 
                className="absolute bottom-0 left-0 w-full h-0.5 bg-gradient-to-r from-violet-500 to-indigo-500"
                initial={{ width: 0 }}
                whileHover={{ width: "100%" }}
                transition={{ duration: 0.3 }}
            />
        </motion.button>
    );
}

const rippleKeyframes = `
@keyframes ripple {
  0% { transform: scale(0.5); opacity: 0.6; }
  100% { transform: scale(2); opacity: 0; }
}
`;

if (typeof document !== 'undefined') {
    const style = document.createElement('style');
    style.innerHTML = rippleKeyframes;
    document.head.appendChild(style);
}




demo.tsx
import { AnimatedAIChat } from "@/components/ui/animated-ai-chat"

export function Demo() {
  return (
    <div className="flex w-screen overflow-x-hidden">
      <AnimatedAIChat />
    </div>
  );
}

```

Install NPM dependencies:
```bash
lucide-react, framer-motion
```

Extend existing globals.css with this code:
```css
.lab-bg::before {
  overflow: hidden;
  max-width: 100vw;
  max-height: 100vh;
  box-sizing: border-box;
}
```

Implementation Guidelines
 1. Analyze the component structure and identify all required dependencies
 2. Review the component's argumens and state
 3. Identify any required context providers or hooks and install them
 4. Questions to Ask
 - What data/props will be passed to this component?
 - Are there any specific state management requirements?
 - Are there any required assets (images, icons, etc.)?
 - What is the expected responsive behavior?
 - What is the best place to use this component in the app?

Steps to integrate
 0. Copy paste all the code above in the correct directories
 1. Install external dependencies
 2. Fill image assets with Unsplash stock images you know exist
 3. Use lucide-react icons for svgs or logos if component requires them
