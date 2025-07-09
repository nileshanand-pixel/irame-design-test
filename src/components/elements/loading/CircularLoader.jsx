const CircularLoader = ({className, size}) => {
    const classNameMap = {
        'sm': 'border-[2px] size-4',
        'md': 'border-4 size-6',
        'lg': 'border-[6px] size-8',
        'xl': 'border-[8px] size-10'
    }
    return (
        <div class={`border-gray-300 ${size  && classNameMap[size] } animate-spin rounded-full border-2 border-t-purple-80 ${className}`} />
    )
}

export default CircularLoader;