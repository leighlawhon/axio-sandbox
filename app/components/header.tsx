'use client';
import React, { useState } from 'react';
import { useAuth } from '@/app/components/AuthContext';
import AxioMenu from './ui/menu';

const Header: React.FC = () => {
    const [passcode, setPasscode] = useState('');
    const { checkPasscode } = useAuth();

    const handleInputChange = (event: React.ChangeEvent<HTMLInputElement>) => {
        setPasscode(event.target.value);
    };

    const handleButtonClick = () => {
        checkPasscode(passcode);
    };

    return (
        <header className="navbar flex justify-between items-center">
            <img className="logo" src="/axiologo.png" alt="Axio Logo" />
            <h1 className="grow text-lg font-bold">Axio Sandbox</h1>
            <div className="mr-3">
                <input className="bg-blue-600 text-white rounded-sm mr-2 p-1 px-2" type="text" value={passcode} onChange={handleInputChange} placeholder="Enter passcode" />
                <button className="bg-blue-900 text-white font-bold rounded-sm p-1 px-2" onClick={handleButtonClick}>Submit</button>
            </div>
            <AxioMenu />
        </header>
    );
};

export default Header;
