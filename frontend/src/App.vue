<template>
  <div class="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900">
    <!-- Header -->
    <header class="border-b border-slate-700/50 bg-slate-900/50 backdrop-blur-sm">
      <div class="max-w-7xl mx-auto px-4 py-6">
        <h1 class="text-3xl font-bold text-white">
          🔍 Guest Posting & Link Insertion Finder
        </h1>
        <p class="mt-2 text-slate-400">
          Find websites accepting guest posts and link insertions in your niche
        </p>
      </div>
    </header>

    <main class="max-w-7xl mx-auto px-4 py-8">
      <!-- Search Form -->
      <div class="bg-slate-800/50 rounded-2xl border border-slate-700/50 p-6 mb-8">
        <form @submit.prevent="startScraping" class="space-y-6">
          <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <!-- Niche Input -->
            <div>
              <label class="block text-sm font-medium text-slate-300 mb-2">
                Niche / Industry *
              </label>
              <input
                v-model="form.niche"
                type="text"
                placeholder="e.g., technology, health, finance"
                class="w-full px-4 py-3 bg-slate-900/50 border border-slate-600 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-sky-500 focus:border-transparent transition"
                required
              />
            </div>

            <!-- Country Select -->
            <div>
              <label class="block text-sm font-medium text-slate-300 mb-2">
                Country (TLD)
              </label>
              <select
                v-model="form.country"
                class="w-full px-4 py-3 bg-slate-900/50 border border-slate-600 rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-sky-500 focus:border-transparent transition"
              >
                <option value="">All Countries</option>
                <option value="us">United States (.us)</option>
                <option value="uk">United Kingdom (.uk)</option>
                <option value="ca">Canada (.ca)</option>
                <option value="au">Australia (.au)</option>
                <option value="in">India (.in)</option>
                <option value="de">Germany (.de)</option>
                <option value="fr">France (.fr)</option>
                <option value="es">Spain (.es)</option>
                <option value="it">Italy (.it)</option>
                <option value="nl">Netherlands (.nl)</option>
                <option value="br">Brazil (.br)</option>
                <option value="mx">Mexico (.mx)</option>
              </select>
            </div>

            <!-- Search Engine Select -->
            <div>
              <label class="block text-sm font-medium text-slate-300 mb-2">
                Search Engine
              </label>
              <select
                v-model="form.searchEngine"
                class="w-full px-4 py-3 bg-slate-900/50 border border-slate-600 rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-sky-500 focus:border-transparent transition"
              >
                <option value="duckduckgo">DuckDuckGo (Recommended)</option>
                <option value="brave">Brave Search</option>
                <option value="qwant">Qwant</option>
                <option value="mojeek">Mojeek</option>
                <option value="ecosia">Ecosia</option>
                <option value="startpage">Startpage</option>
                <option value="yandex">Yandex</option>
                <option value="searxng">SearXNG</option>
              </select>
            </div>

            <!-- Max Pages -->
            <div>
              <label class="block text-sm font-medium text-slate-300 mb-2">
                Max Pages per Query
              </label>
              <input
                v-model.number="form.maxPages"
                type="number"
                min="1"
                max="10"
                class="w-full px-4 py-3 bg-slate-900/50 border border-slate-600 rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-sky-500 focus:border-transparent transition"
              />
            </div>
          </div>

          <div class="flex gap-4">
            <button
              type="submit"
              :disabled="isLoading || !form.niche"
              class="px-8 py-3 bg-sky-600 hover:bg-sky-500 disabled:bg-slate-600 disabled:cursor-not-allowed text-white font-semibold rounded-xl transition-all duration-200 flex items-center gap-2"
            >
              <svg v-if="isLoading" class="animate-spin h-5 w-5" viewBox="0 0 24 24">
                <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4" fill="none"/>
                <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/>
              </svg>
              {{ isLoading ? 'Scraping...' : 'Start Scraping' }}
            </button>

            <button
              v-if="results.length > 0"
              type="button"
              @click="exportResults"
              class="px-6 py-3 bg-emerald-600 hover:bg-emerald-500 text-white font-semibold rounded-xl transition-all duration-200"
            >
              📥 Export CSV
            </button>

            <button
              v-if="results.length > 0"
              type="button"
              @click="clearResults"
              class="px-6 py-3 bg-slate-600 hover:bg-slate-500 text-white font-semibold rounded-xl transition-all duration-200"
            >
              Clear
            </button>
          </div>
        </form>

        <!-- Progress Bar -->
        <div v-if="isLoading && status.total > 0" class="mt-6">
          <div class="flex justify-between text-sm text-slate-400 mb-2">
            <span>Processing search queries...</span>
            <span>{{ status.progress }} / {{ status.total }}</span>
          </div>
          <div class="h-2 bg-slate-700 rounded-full overflow-hidden">
            <div 
              class="h-full bg-gradient-to-r from-sky-500 to-emerald-500 transition-all duration-300"
              :style="{ width: `${(status.progress / status.total) * 100}%` }"
            />
          </div>
        </div>
      </div>

      <!-- Stats Cards -->
      <div v-if="results.length > 0" class="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
        <div class="bg-slate-800/50 rounded-xl border border-slate-700/50 p-4">
          <div class="text-3xl font-bold text-white">{{ results.length }}</div>
          <div class="text-slate-400 text-sm">Total Found</div>
        </div>
        <div class="bg-slate-800/50 rounded-xl border border-slate-700/50 p-4">
          <div class="text-3xl font-bold text-emerald-400">{{ guestPostCount }}</div>
          <div class="text-slate-400 text-sm">Guest Post Sites</div>
        </div>
        <div class="bg-slate-800/50 rounded-xl border border-slate-700/50 p-4">
          <div class="text-3xl font-bold text-purple-400">{{ linkInsertionCount }}</div>
          <div class="text-slate-400 text-sm">Link Insertion Sites</div>
        </div>
        <div class="bg-slate-800/50 rounded-xl border border-slate-700/50 p-4">
          <div class="text-3xl font-bold text-sky-400">{{ withEmailCount }}</div>
          <div class="text-slate-400 text-sm">With Contact Email</div>
        </div>
      </div>

      <!-- Results Table -->
      <div v-if="results.length > 0" class="bg-slate-800/50 rounded-2xl border border-slate-700/50 overflow-hidden">
        <div class="overflow-x-auto">
          <table class="w-full">
            <thead class="bg-slate-900/50">
              <tr>
                <th class="px-6 py-4 text-left text-xs font-semibold text-slate-300 uppercase tracking-wider">
                  Website
                </th>
                <th class="px-6 py-4 text-left text-xs font-semibold text-slate-300 uppercase tracking-wider">
                  Type
                </th>
                <th class="px-6 py-4 text-left text-xs font-semibold text-slate-300 uppercase tracking-wider">
                  Contact Email
                </th>
                <th class="px-6 py-4 text-left text-xs font-semibold text-slate-300 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody class="divide-y divide-slate-700/50">
              <tr v-for="(result, index) in paginatedResults" :key="index" class="hover:bg-slate-700/20 transition">
                <td class="px-6 py-4">
                  <div class="max-w-md">
                    <a 
                      :href="result.url" 
                      target="_blank" 
                      class="text-sky-400 hover:text-sky-300 font-medium truncate block"
                    >
                      {{ result.title || result.url }}
                    </a>
                    <div class="text-slate-500 text-xs truncate mt-1">{{ result.url }}</div>
                  </div>
                </td>
                <td class="px-6 py-4">
                  <span 
                    :class="getTypeBadgeClass(result.type)"
                    class="px-3 py-1 rounded-full text-xs font-medium"
                  >
                    {{ formatType(result.type) }}
                  </span>
                </td>
                <td class="px-6 py-4">
                  <span v-if="result.contactEmail" class="text-slate-300">
                    {{ result.contactEmail }}
                  </span>
                  <span v-else class="text-slate-600">—</span>
                </td>
                <td class="px-6 py-4">
                  <a 
                    :href="result.url" 
                    target="_blank"
                    class="text-slate-400 hover:text-white transition"
                  >
                    <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                    </svg>
                  </a>
                </td>
              </tr>
            </tbody>
          </table>
        </div>

        <!-- Pagination -->
        <div v-if="totalPages > 1" class="px-6 py-4 bg-slate-900/30 flex justify-between items-center">
          <div class="text-slate-400 text-sm">
            Showing {{ (currentPage - 1) * perPage + 1 }} - {{ Math.min(currentPage * perPage, results.length) }} of {{ results.length }}
          </div>
          <div class="flex gap-2">
            <button
              @click="currentPage--"
              :disabled="currentPage === 1"
              class="px-4 py-2 bg-slate-700 hover:bg-slate-600 disabled:opacity-50 disabled:cursor-not-allowed text-white rounded-lg transition"
            >
              Previous
            </button>
            <button
              @click="currentPage++"
              :disabled="currentPage === totalPages"
              class="px-4 py-2 bg-slate-700 hover:bg-slate-600 disabled:opacity-50 disabled:cursor-not-allowed text-white rounded-lg transition"
            >
              Next
            </button>
          </div>
        </div>
      </div>

      <!-- Empty State -->
      <div v-else-if="!isLoading" class="text-center py-16">
        <div class="text-6xl mb-4">🔍</div>
        <h3 class="text-xl font-semibold text-white mb-2">No results yet</h3>
        <p class="text-slate-400">Enter a niche and start scraping to find guest posting opportunities</p>
      </div>
    </main>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, onUnmounted } from 'vue'
import axios from 'axios'

const form = ref({
  niche: '',
  country: '',
  searchEngine: 'duckduckgo',
  maxPages: 3
})

const results = ref([])
const isLoading = ref(false)
const status = ref({ progress: 0, total: 0 })
const currentPage = ref(1)
const perPage = 20
let statusInterval = null

// Computed
const guestPostCount = computed(() => 
  results.value.filter(r => r.type === 'guest_post' || r.type === 'both').length
)

const linkInsertionCount = computed(() => 
  results.value.filter(r => r.type === 'link_insertion' || r.type === 'both').length
)

const withEmailCount = computed(() => 
  results.value.filter(r => r.contactEmail).length
)

const totalPages = computed(() => Math.ceil(results.value.length / perPage))

const paginatedResults = computed(() => {
  const start = (currentPage.value - 1) * perPage
  return results.value.slice(start, start + perPage)
})

// Methods
const startScraping = async () => {
  isLoading.value = true
  results.value = []
  currentPage.value = 1
  
  try {
    await axios.post('/api/scrape', form.value)
    
    // Start polling for status and results
    statusInterval = setInterval(async () => {
      const [statusRes, resultsRes] = await Promise.all([
        axios.get('/api/status'),
        axios.get('/api/results')
      ])
      
      status.value = statusRes.data
      results.value = resultsRes.data
      
      if (!statusRes.data.isRunning) {
        clearInterval(statusInterval)
        isLoading.value = false
      }
    }, 2000)
  } catch (error) {
    console.error('Error starting scrape:', error)
    isLoading.value = false
  }
}

const exportResults = () => {
  window.open('/api/export', '_blank')
}

const clearResults = async () => {
  await axios.delete('/api/results')
  results.value = []
}

const formatType = (type) => {
  const types = {
    guest_post: 'Guest Post',
    link_insertion: 'Link Insertion',
    both: 'Both',
    unknown: 'Unknown'
  }
  return types[type] || type
}

const getTypeBadgeClass = (type) => {
  const classes = {
    guest_post: 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30',
    link_insertion: 'bg-purple-500/20 text-purple-400 border border-purple-500/30',
    both: 'bg-sky-500/20 text-sky-400 border border-sky-500/30',
    unknown: 'bg-slate-500/20 text-slate-400 border border-slate-500/30'
  }
  return classes[type] || classes.unknown
}

onUnmounted(() => {
  if (statusInterval) clearInterval(statusInterval)
})
</script>
