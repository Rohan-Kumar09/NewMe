import { useEffect, useRef } from "react";


export function useAnimateOnScroll<T extends HTMLElement>(
 animationClass: string,
 threshold = 0.5
) {
 const ref = useRef<T | null>(null);


 useEffect(() => {
 const el = ref.current;
 if (!el) return;


 const observer = new IntersectionObserver(
   ([entry]) => {
     if (entry.isIntersecting) {
       // split by space to pass multiple classes
       el.classList.add("animate__animated", ...animationClass.split(" "));


       const handleEnd = () => {
         el.classList.remove("animate__animated", ...animationClass.split(" "));
       };


       el.addEventListener("animationend", handleEnd, { once: true });
     }
   },
   { threshold }
 );


 observer.observe(el);


 return () => observer.disconnect();
}, [animationClass, threshold]);




 return ref;
}
