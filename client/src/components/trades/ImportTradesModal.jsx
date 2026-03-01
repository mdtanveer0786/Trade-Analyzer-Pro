import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { X, Upload, FileText, CheckCircle, AlertTriangle, Loader2 } from 'lucide-react'
import { toast } from 'react-hot-toast'

const ImportTradesModal = ({ isOpen, onClose, onImportSuccess, api }) => {
    const [file, setFile] = useState(null)
    const [broker, setBroker] = useState('standard')
    const [isUploading, setIsUploading] = useState(false)

    const handleFileChange = (e) => {
        const selectedFile = e.target.files[0]
        if (selectedFile && selectedFile.type === 'text/csv') {
            setFile(selectedFile)
        } else {
            toast.error('Please select a valid CSV file')
        }
    }

    const handleUpload = async () => {
        if (!file) return toast.error('Please select a file first')

        setIsUploading(true)
        const formData = new FormData()
        formData.append('csvFile', file)
        formData.append('broker', broker)

        try {
            const response = await api.post('/trades/import', formData, {
                headers: { 'Content-Type': 'multipart/form-data' }
            })
            
            toast.success(`Successfully imported ${response.data.data?.length || 0} trades!`)
            onImportSuccess()
            onClose()
        } catch (error) {
            console.error('Import Error:', error)
            const message = error.response?.data?.message || 'Failed to import trades'
            toast.error(message)
        } finally {
            setIsUploading(false)
        }
    }

    if (!isOpen) return null

    return (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <motion.div
                initial={{ scale: 0.9, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                className="bg-gray-900 rounded-2xl border border-gray-800 w-full max-w-md overflow-hidden shadow-2xl"
            >
                <div className="p-6 border-b border-gray-800 flex items-center justify-between">
                    <h2 className="text-xl font-bold">Import Trades</h2>
                    <button onClick={onClose} className="p-2 hover:bg-gray-800 rounded-lg transition-colors">
                        <X className="w-5 h-5" />
                    </button>
                </div>

                <div className="p-6 space-y-6">
                    {/* Broker Selection */}
                    <div>
                        <label className="text-sm font-medium text-gray-400 block mb-2">Select Broker Format</label>
                        <select
                            value={broker}
                            onChange={(e) => setBroker(e.target.value)}
                            className="w-full px-4 py-2 bg-gray-800 border border-gray-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                        >
                            <option value="standard">Standard CSV</option>
                            <option value="zerodha">Zerodha (Kite)</option>
                            <option value="upstox">Upstox</option>
                            <option value="groww">Groww</option>
                        </select>
                    </div>

                    {/* File Upload Area */}
                    <div 
                        className={`border-2 border-dashed rounded-xl p-8 text-center transition-colors ${
                            file ? 'border-blue-500 bg-blue-500/5' : 'border-gray-800 hover:border-gray-700'
                        }`}
                    >
                        <input
                            type="file"
                            id="csvFile"
                            accept=".csv"
                            onChange={handleFileChange}
                            className="hidden"
                        />
                        <label htmlFor="csvFile" className="cursor-pointer block">
                            {file ? (
                                <div className="space-y-2">
                                    <FileText className="w-12 h-12 text-blue-400 mx-auto" />
                                    <p className="text-sm font-medium text-blue-400">{file.name}</p>
                                    <p className="text-xs text-gray-500">Click to change file</p>
                                </div>
                            ) : (
                                <div className="space-y-2">
                                    <Upload className="w-12 h-12 text-gray-600 mx-auto" />
                                    <p className="text-sm font-medium text-gray-300">Choose CSV File</p>
                                    <p className="text-xs text-gray-500">Only .csv files are supported</p>
                                </div>
                            )}
                        </label>
                    </div>

                    {/* Helper Info */}
                    <div className="bg-blue-500/10 rounded-lg p-4 flex items-start space-x-3">
                        <AlertTriangle className="w-5 h-5 text-blue-400 flex-shrink-0 mt-0.5" />
                        <p className="text-xs text-blue-400 leading-relaxed">
                            Ensure your CSV follows the {broker} format. Large imports may take a few moments to process.
                        </p>
                    </div>
                </div>

                <div className="p-6 bg-gray-900/50 flex space-x-3">
                    <button
                        onClick={onClose}
                        className="flex-1 px-4 py-2 bg-gray-800 hover:bg-gray-700 rounded-lg font-medium transition-colors"
                    >
                        Cancel
                    </button>
                    <button
                        onClick={handleUpload}
                        disabled={!file || isUploading}
                        className="flex-1 px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 rounded-lg font-medium transition-all shadow-lg shadow-blue-500/20 flex items-center justify-center space-x-2"
                    >
                        {isUploading ? (
                            <>
                                <Loader2 className="w-4 h-4 animate-spin" />
                                <span>Importing...</span>
                            </>
                        ) : (
                            <>
                                <CheckCircle className="w-4 h-4" />
                                <span>Import Now</span>
                            </>
                        )}
                    </button>
                </div>
            </motion.div>
        </div>
    )
}

export default ImportTradesModal
