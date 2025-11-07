import { useState } from 'react'
import { motion } from 'framer-motion'

function App() {
  const [count, setCount] = useState(0)

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="max-w-2xl w-full bg-white rounded-2xl shadow-2xl p-8"
      >
        <motion.h1
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.2 }}
          className="text-5xl font-bold text-center mb-8 bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent"
        >
          FFS Finance PWA
        </motion.h1>

        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.4 }}
          className="text-center mb-8"
        >
          <p className="text-gray-600 mb-4">
            Progressive Web App con React 18, Vite, Tailwind CSS v3 y Framer Motion
          </p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.6 }}
          className="bg-gradient-to-r from-blue-500 to-indigo-600 rounded-xl p-8 text-center"
        >
          <h2 className="text-white text-2xl font-semibold mb-4">Counter Demo</h2>
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => setCount((count) => count + 1)}
            className="bg-white text-indigo-600 px-8 py-4 rounded-lg font-bold text-xl shadow-lg hover:shadow-xl transition-shadow"
          >
            Count: {count}
          </motion.button>
        </motion.div>

        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.8 }}
          className="mt-8 grid grid-cols-1 md:grid-cols-3 gap-4"
        >
          <motion.div
            whileHover={{ y: -5 }}
            className="p-4 bg-blue-50 rounded-lg text-center"
          >
            <div className="text-3xl mb-2">⚡</div>
            <p className="text-sm font-semibold text-gray-700">Vite Lightning Fast</p>
          </motion.div>
          <motion.div
            whileHover={{ y: -5 }}
            className="p-4 bg-indigo-50 rounded-lg text-center"
          >
            <div className="text-3xl mb-2">🎨</div>
            <p className="text-sm font-semibold text-gray-700">Tailwind CSS v3</p>
          </motion.div>
          <motion.div
            whileHover={{ y: -5 }}
            className="p-4 bg-purple-50 rounded-lg text-center"
          >
            <div className="text-3xl mb-2">✨</div>
            <p className="text-sm font-semibold text-gray-700">Framer Motion</p>
          </motion.div>
        </motion.div>
      </motion.div>
    </div>
  )
}

export default App
