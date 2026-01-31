import React from 'react'

const GlowingInput = ({
  type = 'text',
  placeholder = '',
  value,
  onChange,
  required = false,
  minLength,
  icon: Icon,
  className = ''
}) => {
  return (
    <div className="relative flex items-center justify-center w-full">
      <div id="poda" className="relative flex items-center justify-center group w-full">
        {/* Outermost blur layer - main gradient rotation */}
        <div className="absolute z-[-1] overflow-hidden h-full w-full max-h-[54px] rounded-xl blur-[3px]
                        before:absolute before:content-[''] before:z-[-2] before:w-[999px] before:h-[999px] before:bg-no-repeat before:top-1/2 before:left-1/2 before:-translate-x-1/2 before:-translate-y-1/2 before:rotate-[60deg]
                        before:bg-[conic-gradient(#000,#402fb5_5%,#000_38%,#000_50%,#cf30aa_60%,#000_87%)] before:transition-all before:duration-[2000ms]
                        group-hover:before:rotate-[-120deg] group-focus-within:before:rotate-[420deg] group-focus-within:before:duration-[4000ms]">
        </div>

        {/* Second blur layer - purple/pink accent */}
        <div className="absolute z-[-1] overflow-hidden h-full w-full max-h-[52px] rounded-xl blur-[3px]
                        before:absolute before:content-[''] before:z-[-2] before:w-[600px] before:h-[600px] before:bg-no-repeat before:top-1/2 before:left-1/2 before:-translate-x-1/2 before:-translate-y-1/2 before:rotate-[82deg]
                        before:bg-[conic-gradient(rgba(0,0,0,0),#18116a,rgba(0,0,0,0)_10%,rgba(0,0,0,0)_50%,#6e1b60,rgba(0,0,0,0)_60%)] before:transition-all before:duration-[2000ms]
                        group-hover:before:rotate-[-98deg] group-focus-within:before:rotate-[442deg] group-focus-within:before:duration-[4000ms]">
        </div>

        {/* Third blur layer - duplicate for intensity */}
        <div className="absolute z-[-1] overflow-hidden h-full w-full max-h-[52px] rounded-xl blur-[3px]
                        before:absolute before:content-[''] before:z-[-2] before:w-[600px] before:h-[600px] before:bg-no-repeat before:top-1/2 before:left-1/2 before:-translate-x-1/2 before:-translate-y-1/2 before:rotate-[82deg]
                        before:bg-[conic-gradient(rgba(0,0,0,0),#18116a,rgba(0,0,0,0)_10%,rgba(0,0,0,0)_50%,#6e1b60,rgba(0,0,0,0)_60%)] before:transition-all before:duration-[2000ms]
                        group-hover:before:rotate-[-98deg] group-focus-within:before:rotate-[442deg] group-focus-within:before:duration-[4000ms]">
        </div>

        {/* Fourth blur layer */}
        <div className="absolute z-[-1] overflow-hidden h-full w-full max-h-[52px] rounded-xl blur-[3px]
                        before:absolute before:content-[''] before:z-[-2] before:w-[600px] before:h-[600px] before:bg-no-repeat before:top-1/2 before:left-1/2 before:-translate-x-1/2 before:-translate-y-1/2 before:rotate-[82deg]
                        before:bg-[conic-gradient(rgba(0,0,0,0),#18116a,rgba(0,0,0,0)_10%,rgba(0,0,0,0)_50%,#6e1b60,rgba(0,0,0,0)_60%)] before:transition-all before:duration-[2000ms]
                        group-hover:before:rotate-[-98deg] group-focus-within:before:rotate-[442deg] group-focus-within:before:duration-[4000ms]">
        </div>

        {/* Bright highlight layer */}
        <div className="absolute z-[-1] overflow-hidden h-full w-full max-h-[50px] rounded-lg blur-[2px]
                        before:absolute before:content-[''] before:z-[-2] before:w-[600px] before:h-[600px] before:bg-no-repeat before:top-1/2 before:left-1/2 before:-translate-x-1/2 before:-translate-y-1/2 before:rotate-[83deg]
                        before:bg-[conic-gradient(rgba(0,0,0,0)_0%,#a099d8,rgba(0,0,0,0)_8%,rgba(0,0,0,0)_50%,#dfa2da,rgba(0,0,0,0)_58%)] before:brightness-[1.4]
                        before:transition-all before:duration-[2000ms] group-hover:before:rotate-[-97deg] group-focus-within:before:rotate-[443deg] group-focus-within:before:duration-[4000ms]">
        </div>

        {/* Inner shadow layer */}
        <div className="absolute z-[-1] overflow-hidden h-full w-full max-h-[48px] rounded-xl blur-[0.5px]
                        before:absolute before:content-[''] before:z-[-2] before:w-[600px] before:h-[600px] before:bg-no-repeat before:top-1/2 before:left-1/2 before:-translate-x-1/2 before:-translate-y-1/2 before:rotate-[70deg]
                        before:bg-[conic-gradient(#1c191c,#402fb5_5%,#1c191c_14%,#1c191c_50%,#cf30aa_60%,#1c191c_64%)] before:brightness-[1.3]
                        before:transition-all before:duration-[2000ms] group-hover:before:rotate-[-110deg] group-focus-within:before:rotate-[430deg] group-focus-within:before:duration-[4000ms]">
        </div>

        {/* Main input container */}
        <div id="main" className="relative group w-full">
          <input
            placeholder={placeholder}
            type={type}
            value={value}
            onChange={onChange}
            required={required}
            minLength={minLength}
            className={`bg-[#010201] border-none w-full h-[46px] rounded-lg text-white ${Icon ? 'pl-12' : 'pl-4'} pr-4 text-base focus:outline-none placeholder-gray-500 ${className}`}
          />

          {/* Pink glow mask that fades on hover */}
          <div className="pointer-events-none w-[30px] h-[20px] absolute bg-[#cf30aa] top-[13px] left-[10px] blur-2xl opacity-80 transition-all duration-[2000ms] group-hover:opacity-0"></div>

          {/* Icon on the left */}
          {Icon && (
            <div className="absolute left-4 top-1/2 -translate-y-1/2 pointer-events-none">
              <Icon className="w-5 h-5 text-purple-300" />
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

export default GlowingInput
