import { Rows, Columns } from 'lucide-react';
import { PanelResizeHandle } from 'react-resizable-panels';
import { SplitDirection } from '../types/data.ts';
import { ResizeHandleProps } from '../types/props.ts';

const ResizeHandle = ({ id, direction }: ResizeHandleProps) => {
    const isHorizontal = direction === SplitDirection.HORIZONTAL;

    return (
        <PanelResizeHandle id={id} className="relative">
            <div
                className={`
                    flex items-center justify-center bg-gray-100
                    ${isHorizontal
                        ? 'w-px h-full cursor-col-resize'
                        : 'h-px w-full cursor-row-resize'}
                `}
            >
                <div
                    className={`
                        flex items-center justify-center
                        ${isHorizontal
                            ? 'h-6 -mx-2.5 bg-white border rounded px-1'
                            : 'w-6 -my-2.5 bg-white border rounded py-1'}
                    `}
                >
                    {isHorizontal
                        ? <Rows className="w-3 h-3 text-gray-400" />
                        : <Columns className="w-3 h-3 text-gray-400" />
                    }
                </div>
            </div>
        </PanelResizeHandle>
    );
};

export default ResizeHandle;