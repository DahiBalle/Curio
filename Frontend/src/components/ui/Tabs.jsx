import React, { useState } from 'react';
import './Tabs.css';
import { Icon } from './Icon';
export const Tabs = ({ tabs, defaultTab = 0, onTabChange }) => {
    const [activeTab, setActiveTab] = useState(defaultTab);
    const handleTabClick = (index) => {
        setActiveTab(index);
        if (onTabChange) onTabChange(index);
    };
    return (
        <div className="ui-tabs-container">
            <div className="ui-tabs-header">
                {tabs.map((tab, index) => {
                    const isActive = index === activeTab;
                    return (
                        <button
                            key={index}
                            className={`ui-tab-button ${isActive ? 'ui-tab-button--active' : ''}`}
                            onClick={() => handleTabClick(index)}
                        >
                            {tab.icon && (
                                <Icon
                                    name={tab.icon}
                                    size={12}
                                    color={isActive ? 'var(--text-h)' : 'var(--text)'}
                                    className="ui-tab-icon"
                                />
                            )}
                            <span>{tab.label}</span>
                        </button>
                    );
                })}
            </div>
        </div>
    );
};
