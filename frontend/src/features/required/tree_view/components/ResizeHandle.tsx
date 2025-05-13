import { PanelResizeHandle } from 'react-resizable-panels';
import { SplitDirection } from '../types/types.data.ts';
import { ResizeHandleProps } from '../types/types.props.ts';

const ResizeHandle = ({ id, direction }: ResizeHandleProps) => {
    const isHorizontal = direction === SplitDirection.HORIZONTAL;

    return (
        <PanelResizeHandle id={id} className="relative">
            <div
                className={`
                    bg-gray-200 hover:bg-blue-400 transition-colors
                    ${isHorizontal
                        ? 'w-1 h-full cursor-col-resize'
                        : 'h-1 w-full cursor-row-resize'}
                `}
            />
        </PanelResizeHandle>
    );
};

export default ResizeHandle;