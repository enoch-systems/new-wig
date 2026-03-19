'use client'

import React, { useState, useEffect } from 'react'
import Link from 'next/link'
import { ArrowLeft, Star, Minus, Plus, Loader2, Circle, Upload } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { HeroHeader } from '@/components/header'
import Footer from '@/components/footer'
import { useCart, CartItem } from '@/components/cart-context'
import { getProductById, Product, getAllProducts } from '@/lib/products'

const StarRating = ({ rating }: { rating: number }) => {
    return (
        <div className="flex items-center gap-1">
            {[1, 2, 3, 4, 5].map((star) => (
                <Star
                    key={star}
                    className={`size-3 ${
                        star <= Math.floor(rating)
                            ? 'fill-amber-600 text-amber-600'
                            : 'text-gray-300'
                    }`}
                />
            ))}
            <span className="text-xs text-gray-600 ml-1">({rating})</span>
        </div>
    )
}

const getColorHex = (colorName: string): string => {
    const colorMap: { [key: string]: string } = {
        'Black': '#1a1a1a',
        'Brown': '#6d4c41',
        'Dark Red': '#8B0000',
        'Blonde': '#F4D03F',
        'Natural Black': '#1a1a1a',
        'Dark Brown': '#3e2723',
        'Chestnut Brown': '#6d4c41',
        'Jet Black': '#000000',
        'Off Black': '#2d2d2d',
        'Charcoal': '#36454f',
        'Platinum Blonde': '#f8f8ff',
        'Icy Blonde': '#e6f3ff',
        'Diamond Blonde': '#fafafa',
        'Honey Blonde': '#e6b800',
        'Auburn Red': '#a52a2a',
        'Burgundy Red': '#800020',
        'Copper Red': '#b87333',
        'Strawberry Red': '#ff6347',
        'Honey Brown': '#8b4513',
        'Caramel Brown': '#cd853f',
        'Chocolate Brown': '#3b2f2f',
        'Medium Brown': '#5c4033',
        'Light Brown': '#bc9a6a',
        'Rich Brown': '#654321',
        'Espresso Brown': '#2f1b14',
        'Ash Blonde': '#e0e0e0',
        'Strawberry Blonde': '#ffc0cb',
        'Pearl Blonde': '#f8f6f0',
        'Classic Auburn': '#8b4513',
        'Copper Auburn': '#b87333',
        'Burgundy Auburn': '#800020',
        'Strawberry Auburn': '#ff6347',
        'Velvet Red': '#8b0000',
        'Wine Red': '#722f37',
        'Cherry Red': '#de3163'
    }
    return colorMap[colorName] || '#cccccc'
}

export default function DynamicProductPage({ params }: { params: Promise<{ productId: string }> }) {
    const { addToCart } = useCart()
    const [product, setProduct] = useState<Product | null>(null)
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState<string | null>(null)
    const [selectedImage, setSelectedImage] = useState(0)
    const [selectedColor, setSelectedColor] = useState('Black')
    const [selectedSize, setSelectedSize] = useState('')
    const [quantity, setQuantity] = useState(1)
    const [addedToCart, setAddedToCart] = useState<Set<string>>(new Set())
    const [relatedProducts, setRelatedProducts] = useState<Product[]>([])
    const [customColor, setCustomColor] = useState('')
    const [isCustomColorDropdownOpen, setIsCustomColorDropdownOpen] = useState(false)
    const [mainDisplayImage, setMainDisplayImage] = useState<string>('')

    const resolvedParams = React.use(params)

    useEffect(() => {
        const loadProduct = async () => {
            try {
                setLoading(true)
                setError(null)
                const productId = resolvedParams.productId
                const productData = await getProductById(productId)
                if (!productData) {
                    throw new Error('Product not found')
                }
                setProduct(productData)
                setSelectedImage(0) // Reset to first image when product loads
                setMainDisplayImage(productData.image || productData.images?.[0] || '')
            } catch (err) {
                setError(err instanceof Error ? err.message : 'Failed to load product')
            } finally {
                setLoading(false)
            }
        }

        loadProduct()
    }, [resolvedParams.productId])

    useEffect(() => {
        const loadRelatedProducts = async () => {
            try {
                const allProducts = await getAllProducts()
                const filtered = allProducts.filter(p => p.id !== product?.id)
                const shuffled = [...filtered].sort(() => 0.5 - Math.random())
                const random = shuffled.slice(0, 4)
                setRelatedProducts(random)
            } catch (err) {
                console.error('Failed to load related products:', err)
            }
        }

        if (product) {
            if (product.sizes && product.sizes.length > 0) {
                setSelectedSize(product.sizes[0])
            }
            loadRelatedProducts()
        }
    }, [product])

    useEffect(() => {
        const handleStorageChange = async () => {
            try {
                const productId = resolvedParams.productId
                const productData = await getProductById(productId)
                if (productData) {
                    setProduct(productData)
                    setMainDisplayImage(productData.image || productData.images?.[0] || '')
                }
            } catch (err) {
                console.error('Failed to reload product:', err)
            }
        }

        const handleStorageEvent = (e: StorageEvent) => {
            if (e.key === 'productsUpdated') {
                handleStorageChange()
            }
        }

        const handleProductsChanged = () => {
            handleStorageChange()
        }

        window.addEventListener('storage', handleStorageEvent)
        window.addEventListener('productsChanged', handleProductsChanged)
        return () => {
            window.removeEventListener('storage', handleStorageEvent)
            window.removeEventListener('productsChanged', handleProductsChanged)
        }
    }, [resolvedParams.productId])

    const handleAddToCart = () => {
        if (!product) return
        if (!selectedSize) {
            alert('Please select size')
            return
        }
        if (product.colors && product.colors.length > 0 && !selectedColor) {
            alert('Please select color')
            return
        }

        addToCart({
            id: product.id,
            name: product.name,
            price: product.price,
            originalPrice: product.originalPrice || '',
            image: product.images?.[0] || '',
            badge: product.badge,
            color: selectedColor || customColor,
            length: selectedSize
        })
        
        setAddedToCart(prev => new Set([...prev, product.id]))
        
        setTimeout(() => {
            setAddedToCart(prev => {
                const newSet = new Set(prev)
                newSet.delete(product.id)
                return newSet
            })
        }, 1000)
    }

    if (loading) {
        return (
            <>
                <HeroHeader />
                <main className="overflow-hidden">
                    <section className="py-8 mt-16 px-4 sm:px-6 lg:px-8 bg-gray-50">
                        <div className="max-w-7xl mx-auto">
                            <Link href="/shop" className="mb-6 inline-block">
                                <Button className="flex items-center gap-2 bg-transparent border border-gray-400 text-gray-700 hover:bg-gray-50 mb-7">
                                    <ArrowLeft className="w-5 h-5" />
                                    Back to Shopping
                                </Button>
                            </Link>
                            <div className="flex items-center justify-center min-h-[400px]">
                                <div className="text-center">
                                    <Loader2 className="w-8 h-8 animate-spin mx-auto mb-4 text-amber-900" />
                                    <p className="text-gray-600">Loading product...</p>
                                </div>
                            </div>
                        </div>
                    </section>
                </main>
            </>
        )
    }

    if (error || !product) {
        return (
            <>
                <HeroHeader />
                <main className="overflow-hidden">
                    <section className="py-8 mt-16 px-4 sm:px-6 lg:px-8 bg-gray-50">
                        <div className="max-w-7xl mx-auto">
                            <Link href="/shop" className="mb-6 inline-block">
                                <Button className="flex items-center gap-2 bg-transparent border border-gray-400 text-gray-700 hover:bg-gray-50 mb-7">
                                    <ArrowLeft className="w-5 h-5" />
                                    Back to Shopping
                                </Button>
                            </Link>
                            <div className="flex items-center justify-center min-h-[400px]">
                                <div className="text-center">
                                    <div className="text-red-500 mb-4">Error loading product</div>
                                    <p className="text-gray-600 mb-4">{error}</p>
                                    <Link href="/shop">
                                        <Button className="bg-amber-900 text-white hover:bg-amber-800">
                                            Back to Shop
                                        </Button>
                                    </Link>
                                </div>
                            </div>
                        </div>
                    </section>
                </main>
            </>
        )
    }

    return (
        <>
            <HeroHeader />
            <main className="overflow-hidden">
                <section className="py-6 sm:py-8 lg:py-12 mt-16 px-4 sm:px-6 lg:px-8 bg-gradient-to-b from-gray-50 to-white">
                    <div className="max-w-7xl mx-auto">
                        <div className="mb-6 sm:mb-8">
                            <Link href="/shop">
                                <Button className="flex items-center gap-2 bg-white border border-gray-300 text-gray-700 hover:bg-gray-50 hover:border-gray-400 shadow-sm transition-all duration-200">
                                    <ArrowLeft className="w-4 h-4" />
                                    <span className="hidden sm:inline">Back to Shopping</span>
                                    <span className="sm:hidden">Back</span>
                                </Button>
                            </Link>
                        </div>
                        <div className="bg-gray-100 rounded-2xl shadow-xl border border-gray-100 p-0">
                            <div className="lg:grid lg:grid-cols-[1.1fr_0.9fr] lg:gap-10">
                                {/* Image Gallery */}
                                <div className="p-0 lg:p-8">
                                    <div className="space-y-4">
                                        {/* Main Image */}
                                        <div className="w-full h-[32rem] bg-gray-200 border-2 border-dashed border-gray-300 rounded-lg flex items-center justify-center relative">
                                            {mainDisplayImage ? (
                                                <>
                                                <img
                                                    src={mainDisplayImage}
                                                    alt={product.name}
                                                    className={`w-full h-full object-cover rounded-lg ${
                                                        !product.inStock ? 'brightness-50' : ''
                                                    }`}
                                                    onError={() => setMainDisplayImage('')}
                                                />
                                                {/* Sold Out Badge */}
                                                {!product.inStock && (
                                                    <div className="absolute inset-0 bg-black/60 flex items-center justify-center">
                                                        <div className="bg-white px-3 py-1 rounded-full">
                                                            <span className="text-red-500 font-semibold text-sm">SOLD OUT</span>
                                                        </div>
                                                    </div>
                                                )}
                                                </>
                                            ) : (
                                                <div className="text-center">
                                                    <Upload className="mx-auto text-gray-400" size={48} />
                                                    <p className="text-gray-500 mt-2">No image available</p>
                                                </div>
                                            )}
                                        </div>

                                        {/* Thumbnails Below Main Image */}
                                        <div className="flex gap-2 pb-3 justify-center">
                                            {/* Only show main image thumbnail if it exists */}
                                            {product.image || product.images?.[0] ? (
                                                <div className="relative flex-shrink-0">
                                                    <div 
                                                        className={`w-16 h-16 sm:w-20 sm:h-20 bg-gray-200 rounded-lg flex items-center justify-center cursor-pointer transition-colors overflow-hidden ${
                                                            mainDisplayImage === (product.image || product.images?.[0] || '')
                                                                ? 'border-2 border-amber-600 border-solid' 
                                                                : 'border-2 border-dashed border-gray-300 hover:border-gray-400'
                                                        }`}
                                                        onClick={() => setMainDisplayImage(product.image || product.images?.[0] || '')}
                                                    >
                                                        <img
                                                            src={product.image || product.images?.[0]}
                                                            alt="Main thumbnail"
                                                            className="w-full h-full object-cover rounded-lg"
                                                        />
                                                    </div>
                                                </div>
                                            ) : null}

                                            {/* Only show additional thumbnails if they exist and have images */}
                                            {(product.images || []).slice(1, 4).filter(image => image).map((image, index) => (
                                                <div key={index} className="relative flex-shrink-0">
                                                    <div 
                                                        className={`w-16 h-16 sm:w-20 sm:h-20 bg-gray-200 rounded-lg flex items-center justify-center cursor-pointer transition-colors overflow-hidden ${
                                                            mainDisplayImage === image
                                                                ? 'border-2 border-amber-600 border-solid' 
                                                                : 'border-2 border-dashed border-gray-300 hover:border-gray-400'
                                                        }`}
                                                        onClick={() => setMainDisplayImage(image)}
                                                    >
                                                        <img
                                                            src={image}
                                                            alt={`Product thumbnail ${index + 2}`}
                                                            className="w-full h-full object-cover rounded-lg"
                                                            onError={(e) => {
                                                                e.currentTarget.style.display = 'none'
                                                            }}
                                                        />
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                </div>

                                {/* Product Details */}
                                <div className=" p-6 lg:p-10 rounded-2xl   overflow-hidden">
                                    {/* Subtle background pattern */}
                                    <div className="bg-gradient-to-br from-transparent via-cyan-50/30 to-blue-50/30"></div>

                                    <div className=" space-y-4 lg:space-y-6">

                                        {/* Product Name */}
                                        <div className="space-y-1">
                                            <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-gray-900 to-gray-800 leading-tight">
                                                {product.name}
                                            </h1>
                                            <div className="w-12 lg:w-16 h-0.5 lg:h-1 bg-gradient-to-r from-blue-500 to-cyan-500 rounded-full"></div>
                                        </div>

                                        {/* Price Section */}
                                        <div className="bg-gray-100 backdrop-blur-sm rounded-lg lg:rounded-xl p-4 lg:p-6 ">
                                            <div className="flex items-center gap-3 lg:gap-4">
                                                <span className="text-2xl sm:text-3xl lg:text-4xl font-bold text-black">
                                                    {product.price}
                                                </span>
                                                {product.originalPrice && (
                                                    <span className="text-lg sm:text-xl text-gray-400 line-through font-medium">
                                                        {product.originalPrice}
                                                    </span>
                                                )}
                                            </div>
                                            {product.originalPrice && (
                                                <div className="mt-2 lg:mt-3 inline-flex items-center gap-2 bg-green-100 px-3 lg:px-4 py-1.5 lg:py-2 rounded-full border border-green-200 shadow-sm">
                                                    <span className="text-xs lg:text-sm font-semibold text-green-700">
                                                        Save {Math.round(((parseFloat(product.originalPrice.replace('$', '')) - parseFloat(product.price.replace('$', ''))) / parseFloat(product.originalPrice.replace('$', ''))) * 100)}%
                                                    </span>
                                                </div>
                                            )}
                                        </div>

                                        {/* Rating Section */}
                                        <div className="bg-gray-100 pb-4 backdrop-blur-sm rounded-lg lg:rounded-xl p-4 lg:p-5 -mt-6">
                                            <div className="flex items-center justify-between">
                                                <div className="flex items-center gap-3 lg:gap-4">
                                                    <span className="text-sm lg:text-lg font-semibold text-gray-700">Rating</span>
                                                    <div className="flex items-center gap-2">
                                                        <StarRating rating={product.rating || 0} />
                                                      
                                                    </div>
                                                </div>
                                              
                                            </div>
                                        </div>

                                    <div className="bg-gray-100 p-5 mb-4 rounded-xl border border-gray-100  -mx-4 sm:-mx-6 lg:-mx-8">
                                        <h3 className="text-lg font-semibold text-gray-900 mb-3">Select Color</h3>
                                        <div className="space-y-3">
                                            <div className="flex gap-3">
                                                <select
                                                    value={customColor || selectedColor}
                                                    onChange={(e) => {
                                                        setSelectedColor(e.target.value)
                                                        setCustomColor('')
                                                        setIsCustomColorDropdownOpen(false)
                                                    }}
                                                    className="flex-1 px-4 py-3 rounded-xl border-2 border-gray-200 bg-white/5 text-gray-700 font-semibold text-sm sm:text-base focus:outline-none focus:ring-2 focus:ring-gray-200 focus:border-transparent transition-all appearance-none"
                                                >
                                                    <option value="">Select a color...</option>
                                                    {(product.colors || []).map((color: string) => (
                                                        <option key={color} value={color}>
                                                            {color}
                                                        </option>
                                                    ))}
                                                </select>
                                                <div 
                                                    className={`w-14 h-14 rounded-xl border-2 flex-shrink-0 ${selectedColor || customColor ? 'border-gray-200' : 'border-gray-200'}`}
                                                    style={{
                                                        backgroundColor: getColorHex(customColor || selectedColor)
                                                    }}
                                                />
                                            </div>
                                            <div className="relative">
                                                <button
                                                    type="button"
                                                    onClick={() => setIsCustomColorDropdownOpen(!isCustomColorDropdownOpen)}
                                                    className="text-sm text-amber-600 hover:text-amber-700 font-medium transition-colors"
                                                >
                                                    Color not listed? Request custom color
                                                </button>
                                                {isCustomColorDropdownOpen && (
                                                    <div className="mt-3 p-4 bg-gray-50 border border-gray-200 rounded-xl shadow-sm">
                                                        <div className="flex gap-3">
                                                            <input
                                                                type="text"
                                                                value={customColor}
                                                                onChange={(e) => {
                                                                    setCustomColor(e.target.value)
                                                                    if (e.target.value) {
                                                                        setSelectedColor(e.target.value)
                                                                    }
                                                                }}
                                                                placeholder="Type your color..."
                                                                className="flex-1 px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-600 focus:border-transparent text-sm"
                                                                autoFocus
                                                            />
                                                            <button
                                                                type="button"
                                                                onClick={() => {
                                                                    setCustomColor('')
                                                                    setSelectedColor('Black')
                                                                    setIsCustomColorDropdownOpen(false)
                                                                }}
                                                                className="px-4 py-2 bg-gray-200 text-gray-700 hover:bg-gray-400 rounded-lg text-sm font-medium transition-colors"
                                                            >
                                                                Reset
                                                            </button>
                                                        </div>
                                                        <div className="mt-2 text-xs text-gray-500">
                                                            {customColor && `Selected: ${customColor}`}
                                                        </div>
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    </div>

                                    <div className="bg-gray-100  p-6 mb-4 rounded-xl   -mx-4 sm:-mx-6 lg:-mx-8">
                                        <label className="text-lg font-semibold text-gray-900 block mb-4">Select Length</label>
                                        <div className="flex flex-col gap-3">
                                            {product.sizes && product.sizes.length > 0 ? (
                                                <select
                                                    value={selectedSize}
                                                    onChange={(e) => setSelectedSize(e.target.value)}
                                                    className="px-4 py-3 rounded-xl border-2 border-gray-200 bg-white/5 text-gray-700 font-semibold text-sm sm:text-base focus:outline-none focus:ring-2 focus:ring-gray-200 focus:border-transparent transition-all"
                                                >
                                                    <option value="">Choose a length...</option>
                                                    {product.sizes.map((length: string) => (
                                                        <option key={length} value={length}>
                                                            {length}
                                                        </option>
                                                    ))}
                                                </select>
                                            ) : (
                                                <span className="text-gray-500 italic">No lengths available</span>
                                            )}
                                        </div>
                                        {selectedSize && (
                                            <div className="mt-4 p-4 bg-black/5 border border-gray-200 rounded-xl">
                                                <p className="text-sm text-blue-800 font-medium">✓ Selected Length: <strong>{selectedSize}</strong></p>
                                            </div>
                                        )}
                                    </div>

                                    <button
                                        onClick={handleAddToCart}
                                        disabled={!product.inStock}
                                        className={`w-full py-4 px-8 rounded-xl font-bold text-white transition-all duration-200 text-lg shadow-lg hover:shadow-xl ${
                                            addedToCart.has(product.id)
                                                ? 'bg-green-600 hover:bg-green-700'
                                                : product.inStock
                                                ? 'bg-blue-500 hover:bg-blue-600 hover:scale-[1.02]'
                                                : 'bg-gray-400 cursor-not-allowed'
                                        }`}
                                    >
                                        {addedToCart.has(product.id) ? '✓ Added to Cart' : product.inStock ? 'Add to Cart' : 'SOLD OUT'}
                                    </button>

                                    {relatedProducts.length > 0 && (
                                        <div className="mt-16 border-t border-gray-200 pt-12">
                                            <h3 className="text-xl sm:text-2xl font-semibold text-gray-900 mb-8">You May Also Like</h3>
                                            <div className="grid grid-cols-2 gap-3 sm:gap-4 -mx-4 sm:-mx-6 lg:-mx-8">
                                                {relatedProducts.map(rel => (
                                                    <Link key={rel.id} href={`/shop/${rel.id}`} className="group">
                                                        <div className="bg-cyan-50/30 backdrop-blur-3xl rounded-xl border-2 border-cyan-100 shadow-sm hover:shadow-lg transition-all duration-300 overflow-hidden">
                                                            {/* Product Image */}
                                                            <div className="relative aspect-square bg-gray-50 overflow-hidden">
                                                                {rel.image || rel.images?.[0] ? (
                                                                    <img
                                                                        src={rel.image || rel.images?.[0]}
                                                                        alt={rel.name}
                                                                        className={`w-full h-full object-cover group-hover:scale-105 transition-transform duration-300 ${
                                                                            !rel.inStock ? 'brightness-50' : ''
                                                                        }`}
                                                                        onError={(e) => {
                                                                            e.currentTarget.style.display = 'none';
                                                                        }}
                                                                    />
                                                                ) : (
                                                                    <div className="w-full h-full flex items-center justify-center bg-gray-50">
                                                                        <div className="w-8 h-8 bg-gray-200 rounded-lg mx-auto mb-2"></div>
                                                                        <p className="text-gray-400 text-xs">No image</p>
                                                                    </div>
                                                                )}
                                                                
                                                                {/* Stock Status Badge */}
                                                                <div className="absolute top-2 right-2">
                                                                    <span className={`px-2 py-1 text-xs font-semibold rounded-full ${
                                                                        rel.inStock 
                                                                            ? 'bg-green-100 text-green-700 border border-green-200' 
                                                                            : 'bg-red-100 text-red-700 border border-red-200'
                                                                    }`}>
                                                                        {rel.inStock ? 'In Stock' : 'Out of Stock'}
                                                                    </span>
                                                                </div>
                                                            </div>

                                                            {/* Product Details */}
                                                            <div className="p-3 space-y-2 bg-gradient-to-br from-cyan-50/70 via-cyan-100/60 to-cyan-50/50 backdrop-blur-3xl border-t border-cyan-200/30 shadow-lg relative">
                                                                {/* Glassmorphism overlay effect */}
                                                                <div className="absolute inset-0 bg-gradient-to-t from-cyan-200/15 to-transparent pointer-events-none"></div>
                                                                <div className="relative z-10">
                                                                <h4 className="text-xs font-semibold text-gray-900 group-hover:text-blue-600 transition-colors line-clamp-2 leading-tight">
                                                                    {rel.name.charAt(0).toUpperCase() + rel.name.slice(1).toLowerCase()}
                                                                </h4>

                                                                {/* Price */}
                                                                <div className="flex items-baseline gap-1">
                                                                    <span className="text-sm font-bold text-green-700">{rel.price}</span>
                                                                    {rel.originalPrice && (
                                                                        <span className="text-xs text-gray-400 line-through">{rel.originalPrice}</span>
                                                                    )}
                                                                </div>

                                                                {/* View Details Button */}
                                                                <div className="flex justify-end pt-5">
                                                                    <button className="flex items-center gap-1 text-xs text-gray-500 hover:text-gray-700 transition-colors duration-200">
                                                                        <span>View Details</span>
                                                                        <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                                                                        </svg>
                                                                    </button>
                                                                </div>
                                                            </div>
                                                            </div>
                                                        </div>
                                                    </Link>
                                                ))}
                                            </div>
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>
                        </div>
                    </div>
                </section>
            </main>
            <Footer />
        </>
    )
}
