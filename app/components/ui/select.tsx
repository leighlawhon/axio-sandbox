import React from 'react';
import * as Select from '@radix-ui/react-select';
import classnames from 'classnames';
import { CheckIcon, ChevronDownIcon, ChevronUpIcon } from '@radix-ui/react-icons';
import './select.module.css';
import { Ref } from 'react';
interface SelectAgeGroupProps {
    onValueChange: (value: string) => void;
}

const SelectAgeGroup = ({ onValueChange }: SelectAgeGroupProps): React.ReactElement => (
    <Select.Root onValueChange={onValueChange}>
        <Select.Trigger className="w-full flex relative items-center justify-between SelectTrigger text-sky-600 rounded-md p-2 font-bold border-solid border-color-sky-600 agegroup" aria-label="Food">
            <Select.Value placeholder="Select an age group…" />
            <Select.Icon className="SelectIcon">
                <ChevronDownIcon />
            </Select.Icon>
        </Select.Trigger>
        <Select.Portal>
            <Select.Content className="SelectContent w-full  flex absolute overflow-hidden top-10 ">
                <Select.ScrollUpButton className="SelectScrollButton">
                    <ChevronUpIcon />
                </Select.ScrollUpButton>
                <Select.Viewport className="SelectViewport bg-white ">
                    <Select.Group className="bg-white border-solid border-color-sky-600">
                        {/* <Select.Label className="SelectLabel">Age Group</Select.Label> */}
                        <SelectItem value="any">Any</SelectItem>
                        <SelectItem value="child">Child</SelectItem>
                        <SelectItem value="teen">Teen</SelectItem>
                        <SelectItem value="adult">Adult</SelectItem>
                        <SelectItem value="retiree">Retiree</SelectItem>
                    </Select.Group>
                </Select.Viewport>
            </Select.Content>
        </Select.Portal>
    </Select.Root>
);


const SelectItem = React.forwardRef<HTMLDivElement, { children: React.ReactNode; className?: string; value: string }>(
    ({ children, className, value }, forwardedRef: Ref<HTMLDivElement>) => {
        return (
            <Select.Item className={classnames('SelectItem', className)} value={value} ref={forwardedRef}>
                <Select.ItemText>{value}</Select.ItemText>
                <Select.ItemIndicator className="SelectItemIndicator">
                    <CheckIcon />
                </Select.ItemIndicator>
            </Select.Item>
        );
    }
);

export default SelectAgeGroup;