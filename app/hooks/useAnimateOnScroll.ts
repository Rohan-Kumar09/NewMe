import { useEffect, useRef } from "react";


export function useAnimateOnScroll<T extends HTMLElement>(
 animationClass: string,
 threshold = 0.5
) {
 const ref = useRef<T | null>(null);
 const hasAnimated = useRef(false); // 👈 NEW — ensures it runs only once


 useEffect(() => {
   const el = ref.current;
   if (!el) return;


   const observer = new IntersectionObserver(
     ([entry]) => {
       if (entry.isIntersecting && !hasAnimated.current) {
         hasAnimated.current = true; // mark as done


         // apply animation classes
         el.classList.add("animate__animated", ...animationClass.split(" "));


         // stop observing so it never triggers again
         observer.unobserve(el);
       }
     },
     { threshold }
   );


   observer.observe(el);


   return () => observer.disconnect();
 }, [animationClass, threshold]);


 return ref;
}
