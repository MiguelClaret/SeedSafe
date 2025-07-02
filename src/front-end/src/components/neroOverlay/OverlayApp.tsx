import React, { useContext } from 'react'
import CustomConnectButton from '../features/connect/CustomConnectButton'
import ScreenRenderer from './ScreenRenderer'
import { SendUserOpContext } from '@/contexts'
import { useScreenManager } from '@/hooks'
import type { Screen } from '@/types'

interface OverlayAppProps {
  mode?: 'sidebar' | 'button'
}

const OverlayApp: React.FC<OverlayAppProps> = ({ mode = 'sidebar' }) => {
  const { isWalletPanel } = useContext(SendUserOpContext)!
  const { currentScreen } = useScreenManager()

  if (mode === 'sidebar') {
    return (
      <div
        className={`fixed z-[9999] transition-transform duration-300 ease-in-out transform ${
          isWalletPanel ? 'translate-x-0' : '-translate-x-[350px]'
        }`} 
        style={{ left: 0, top: '80px' }}
      >
        <div className='absolute -right-12'>
          <CustomConnectButton mode={mode} />
        </div>
        <div className='bg-white rounded-md shadow-lg' style={{ width: '350px' }}>
          {isWalletPanel && <ScreenRenderer currentScreen={currentScreen as Screen} />}
        </div>
      </div>
    )
  }

  // button mode: anchor at top-left
  return (
    <div>
      <div className='flex justify-start'>
        <CustomConnectButton mode={mode} />
      </div>
      {isWalletPanel && (
        <div className='fixed z-[9999] sm:top-[100px] top-[160px]' style={{ left: 0, width: '350px' }}>
          <div className='bg-white rounded-md shadow-lg'>
            <ScreenRenderer currentScreen={currentScreen as Screen} />
          </div>
        </div>
      )}
    </div>
  )
}

export default OverlayApp