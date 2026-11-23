import Image from "next/image";
import logoLoading from "@/assets/logo_loading.svg";
import whiteLogoLoading from "@/assets/white_logo_loading.svg";

const LoadingSpinnerIphone = () => {
    return (
        <div className="relative w-full aspect-square sm:aspect-video md:aspect-[21/9] rounded-3xl overflow-hidden group bg-muted/20 flex flex-col items-center justify-center">
          <div className="relative w-32 h-32 animate-pulse">
            <Image 
              src={logoLoading} 
              alt="Loading..." 
              fill 
              className="object-contain dark:hidden"
            />
            <Image 
              src={whiteLogoLoading} 
              alt="Loading..." 
              fill 
              className="object-contain hidden dark:block"
            />
          </div>
        </div>
    );
};

export default LoadingSpinnerIphone;