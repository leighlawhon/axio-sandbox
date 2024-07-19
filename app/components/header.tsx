'use client';
import React from 'react';
import AxioMenu from './menu';
import styles from './header.module.css';
interface HeaderProps {
    title: string;
}

const Header: React.FC<HeaderProps> = ({ title }) => {
    return (

        <nav className={"navbar flex justify-between items-center"}>
            <img className="logo" src="/axiologo.png" alt="Axio Logo" />
            <h1 className="grow text-lg text-bold">{title}</h1>
            <AxioMenu />
        </nav>

    );
};

export default Header;