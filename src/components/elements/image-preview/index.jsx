import { Dialog, DialogContent } from "@/components/ui/dialog"
import { XCircle } from "@phosphor-icons/react"
import { useState } from "react"

export default function ImagePreview({
    file,
    url,
    canCancel=false,
    handleCancel,
    showProgress=false,
    progress=100
}) {

    const [isPreviewOpen, setIsPreviewOpen] = useState(false);

    return (
        <div className="relative inline-flex">
            <img 
                src={url || URL.createObjectURL(file)} 
                className="h-[100px] w-auto rounded-md cursor-pointer"
                onClick = {() => setIsPreviewOpen(prev => !prev)}
            />

            {
                canCancel && 
                <div 
                    className="absolute top-0 right-0 translate-x-[50%] translate-y-[-50%] cursor-pointer bg-[#fff] rounded-full z-[10]"
                    onClick={() => handleCancel(file.name)}
                >
                    <XCircle size={20} color="#26064A99"/>
                </div>
            }

            {showProgress && progress <= 99 ? (
                <div className="absolute bottom-0 left-0 h-[1px] w-full rounded-lg overflow-hidden">
                    <div
                        className="h-full bg-purple-100 rounded-lg"
                        style={{
                            width: `${progress}%`,
                        }}
                    ></div>
                </div>
            ) : null}
            
            <Dialog open={isPreviewOpen} onOpenChange={setIsPreviewOpen}>
                <DialogContent className="min-w-[80vw] h-[80vh]">
                    <div className="mt-[30px] w-full max-h-[calc(80vh-88px)]">
                        <img 
                            src={url || URL.createObjectURL(file)} 
                            className="w-full h-full object-contain"
                        />
                    </div>
                </DialogContent>
            </Dialog>
        </div>
    )
}