import { motion } from 'framer-motion'
import { Image as ImageIcon, Maximize2, ExternalLink, Calendar, TrendingUp, TrendingDown } from 'lucide-react'
import { useState } from 'react'
import { format } from 'date-fns'

const ScreenshotGallery = ({ trades, isLoading }) => {
    const [selectedImage, setSelectedImage] = useState(null)

    const screenshots = trades.flatMap(trade => {
        const images = []
        if (trade.entryScreenshot) {
            images.push({
                url: trade.entryScreenshot,
                type: 'Entry',
                tradeId: trade._id,
                symbol: trade.symbol,
                date: trade.entryDate,
                direction: trade.direction,
                pnl: trade.pnl
            })
        }
        if (trade.exitScreenshot) {
            images.push({
                url: trade.exitScreenshot,
                type: 'Exit',
                tradeId: trade._id,
                symbol: trade.symbol,
                date: trade.exitDate || trade.entryDate,
                direction: trade.direction,
                pnl: trade.pnl
            })
        }
        return images
    }).sort((a, b) => new Date(b.date) - new Date(a.date))

    if (isLoading) {
        return (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 p-6">
                {[...Array(8)].map((_, i) => (
                    <div key={i} className="aspect-video bg-gray-800/50 rounded-2xl animate-pulse border border-gray-700/50" />
                ))}
            </div>
        )
    }

    if (screenshots.length === 0) {
        return (
            <div className="p-20 text-center flex flex-col items-center">
                <div className="w-20 h-20 rounded-full bg-gray-800/50 flex items-center justify-center mb-6">
                    <ImageIcon className="w-10 h-10 text-gray-600" />
                </div>
                <h3 className="text-xl font-bold text-gray-300">No screenshots found</h3>
                <p className="text-gray-500 max-w-sm mx-auto mt-2">
                    Upload entry or exit screenshots when adding trades to build your visual library of trading setups.
                </p>
            </div>
        )
    }

    return (
        <div className="p-6">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                {screenshots.map((img, idx) => (
                    <motion.div
                        key={`${img.tradeId}-${idx}`}
                        initial={{ opacity: 0, scale: 0.9 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ delay: idx * 0.05 }}
                        className="group relative aspect-video bg-gray-900 rounded-2xl overflow-hidden border border-gray-800 hover:border-blue-500/50 transition-all cursor-pointer shadow-lg"
                        onClick={() => setSelectedImage(img)}
                    >
                        <img 
                            src={img.url} 
                            alt={`${img.symbol} ${img.type}`}
                            className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
                        />
                        
                        {/* Overlay */}
                        <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity flex flex-col justify-end p-4">
                            <div className="flex items-center justify-between">
                                <div>
                                    <div className="flex items-center space-x-2">
                                        <span className="font-bold text-white">{img.symbol}</span>
                                        <span className={`text-[10px] px-1.5 py-0.5 rounded font-bold uppercase ${
                                            img.type === 'Entry' ? 'bg-blue-500/20 text-blue-400' : 'bg-purple-500/20 text-purple-400'
                                        }`}>
                                            {img.type}
                                        </span>
                                    </div>
                                    <p className="text-[10px] text-gray-400 mt-1">
                                        {format(new Date(img.date), 'MMM dd, yyyy')}
                                    </p>
                                </div>
                                <div className={`text-sm font-bold ${img.pnl >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                                    {img.pnl >= 0 ? '+' : ''}₹{Math.abs(img.pnl).toLocaleString()}
                                </div>
                            </div>
                        </div>

                        {/* Status Icon */}
                        <div className={`absolute top-3 left-3 p-1.5 rounded-lg backdrop-blur-md border ${
                            img.direction === 'long' ? 'bg-green-500/10 border-green-500/20 text-green-400' : 'bg-red-500/10 border-red-500/20 text-red-400'
                        }`}>
                            {img.direction === 'long' ? <TrendingUp className="w-3.5 h-3.5" /> : <TrendingDown className="w-3.5 h-3.5" />}
                        </div>
                        
                        <div className="absolute top-3 right-3 opacity-0 group-hover:opacity-100 transition-opacity">
                            <div className="p-2 bg-white/10 backdrop-blur-md rounded-lg text-white border border-white/20">
                                <Maximize2 className="w-4 h-4" />
                            </div>
                        </div>
                    </motion.div>
                ))}
            </div>

            {/* Lightbox Modal */}
            <AnimatePresence>
                {selectedImage && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 z-[100] bg-black/95 backdrop-blur-xl flex items-center justify-center p-4 md:p-12"
                        onClick={() => setSelectedImage(null)}
                    >
                        <button className="absolute top-6 right-6 p-3 text-white hover:bg-white/10 rounded-full transition-colors">
                            <ImageIcon className="w-8 h-8 opacity-50" />
                        </button>

                        <motion.div
                            initial={{ scale: 0.9, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            exit={{ scale: 0.9, opacity: 0 }}
                            className="relative max-w-6xl w-full h-full flex flex-col"
                            onClick={e => e.stopPropagation()}
                        >
                            <div className="flex items-center justify-between mb-6">
                                <div className="flex items-center space-x-4">
                                    <div className={`p-3 rounded-2xl ${selectedImage.direction === 'long' ? 'bg-green-500/10 text-green-400' : 'bg-red-500/10 text-red-400'}`}>
                                        {selectedImage.direction === 'long' ? <TrendingUp className="w-6 h-6" /> : <TrendingDown className="w-6 h-6" />}
                                    </div>
                                    <div>
                                        <h2 className="text-2xl font-black text-white">{selectedImage.symbol} - {selectedImage.type} Setup</h2>
                                        <div className="flex items-center space-x-3 text-gray-400 text-sm mt-1">
                                            <span className="flex items-center"><Calendar className="w-4 h-4 mr-1.5" /> {format(new Date(selectedImage.date), 'PPPP')}</span>
                                            <span>•</span>
                                            <span className={selectedImage.pnl >= 0 ? 'text-green-400' : 'text-red-400'}>
                                                PnL: ₹{selectedImage.pnl.toLocaleString()}
                                            </span>
                                        </div>
                                    </div>
                                </div>
                                <div className="flex space-x-3">
                                    <a 
                                        href={selectedImage.url} 
                                        target="_blank" 
                                        rel="noreferrer"
                                        className="p-3 bg-white/5 hover:bg-white/10 border border-white/10 rounded-xl text-white transition-colors flex items-center space-x-2"
                                    >
                                        <ExternalLink className="w-5 h-5" />
                                        <span className="font-bold">Original</span>
                                    </a>
                                    <button 
                                        onClick={() => setSelectedImage(null)}
                                        className="p-3 bg-white/5 hover:bg-white/10 border border-white/10 rounded-xl text-white font-bold"
                                    >
                                        Close
                                    </button>
                                </div>
                            </div>

                            <div className="flex-1 min-h-0 rounded-3xl overflow-hidden border border-white/10 bg-gray-900 flex items-center justify-center">
                                <img 
                                    src={selectedImage.url} 
                                    alt="Trade Setup" 
                                    className="max-w-full max-h-full object-contain"
                                />
                            </div>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    )
}

export default ScreenshotGallery
