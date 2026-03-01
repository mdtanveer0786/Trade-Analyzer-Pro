import { v2 as cloudinary } from 'cloudinary'
import stream from 'stream'

cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET,
})

export const uploadToCloudinary = (buffer, options = {}) => {
    return new Promise((resolve, reject) => {
        const uploadStream = cloudinary.uploader.upload_stream(
            {
                folder: options.folder || 'trades',
                resource_type: options.resource_type || 'auto',
                ...options,
            },
            (error, result) => {
                if (error) {
                    reject(error)
                } else {
                    resolve(result)
                }
            }
        )

        const bufferStream = new stream.PassThrough()
        bufferStream.end(buffer)
        bufferStream.pipe(uploadStream)
    })
}

export const deleteFromCloudinary = async (publicId) => {
    try {
        await cloudinary.uploader.destroy(publicId)
        return true
    } catch (error) {
        console.error('Error deleting from Cloudinary:', error)
        return false
    }
}

export const getOptimizedUrl = (url, options = {}) => {
    if (!url) return null

    const transformations = []

    if (options.width) transformations.push(`w_${options.width}`)
    if (options.height) transformations.push(`h_${options.height}`)
    if (options.quality) transformations.push(`q_${options.quality}`)
    if (options.format) transformations.push(`f_${options.format}`)

    if (transformations.length === 0) return url

    const urlParts = url.split('/upload/')
    if (urlParts.length !== 2) return url

    return `${urlParts[0]}/upload/${transformations.join(',')}/${urlParts[1]}`
}