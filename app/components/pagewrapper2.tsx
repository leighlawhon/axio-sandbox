// import React, { useState } from 'react';

// interface PageWrapperProps {
//     children: React.ReactNode;
// }

// const PageWrapper: React.FC<PageWrapperProps> = ({ children }) => {
//     const [isAllowed, setIsAllowed] = useState<boolean>(false);

//     const handleOnChange = (value: boolean) => {
//         // Check against environment variable here
//         // Replace 'ENV_VARIABLE' with your actual environment variable
//         const isAllowed = process.env.ENV_VARIABLE === value;
//         setIsAllowed(isAllowed);
//     };

//     return (
//         <div>
//             {/* Render header component and pass handleOnChange as a prop */}
//             <Header onChange={handleOnChange} />

//             {/* Render pages and pass isAllowed as a prop */}
//             {React.Children.map(children, (child) => {
//                 return React.cloneElement(child as React.ReactElement, { isAllowed });
//             })}
//         </div>
//     );
// };

// export default PageWrapper;