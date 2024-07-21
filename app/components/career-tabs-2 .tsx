// Pseudocode:
// 1. Define a CareerTabs that receives props from its parent, including the tabs data and a function to fetch tab content.
// 2. Render tab headers based on the received tabs data.
// 3. Use state to manage the currently selected tab and its content.
// 4. When a tab is clicked, update the state to mark it as selected and call the API to fetch content for that tab.
// 5. Render the content of the selected tab.
// 6. Ensure that the content API is called only when a tab is selected and its content is not already fetched.

// React Component Code:
import React, { useState, useEffect } from 'react';

const CareerTabs = ({ careers, fetchTabContentApi, handleGetCareerReq }) => {
    const [selectedTabId, setSelectedTabId] = useState(null);
    const [tabContent, setTabContent] = useState({});
    console.log(careers, 'CAREERS!!!!!!');
    // Fetch tab content when a tab is selected
    useEffect(() => {
        console.log(selectedTabId, 'SELECTED TAB ID!!!!!!');
        const fetchContent = async () => {
            if (selectedTabId && !tabContent[selectedTabId]) {
                const content = await fetchTabContentApi(selectedTabId);
                setTabContent(prevContent => ({ ...prevContent, [selectedTabId]: content }));
            }
        };
        fetchContent();
    }, [selectedTabId, fetchTabContentApi, tabContent]);

    const handleTabClick = (tabId: string) => {
        setSelectedTabId(tabId);
    };

    return (
        <div>
            <ul>
                {careers.map((tab, i) => (
                    <li key={`tab-header-${i}`} onClick={() => handleTabClick(`tab-${i}`)} style={{ cursor: 'pointer', fontWeight: selectedTabId === tab.id ? 'bold' : 'normal' }}>
                        {tab.career_name}
                    </li>

                ))}
            </ul>
            <div>
                {/* Render content of the selected tab */}
                {tabContent[selectedTabId]}
            </div>
        </div>
    );
};

export default CareerTabs;