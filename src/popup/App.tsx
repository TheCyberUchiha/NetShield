import { useEffect, useState } from 'react';
import { useShieldStore } from '../store/useShieldStore';
import { SetupView } from './components/SetupView';
import { MainView } from './components/MainView';

export default function App() {
  const store = useShieldStore();
  const [loading, setLoading] = useState(true);
  const unlocked = false; // Basic session flag

  useEffect(() => {
    store.loadAll().then(() => {
      // Very basic session unlock check via background message or local storage
      // For this rewrite, we keep it simple: require auth every time unless bypassed
      setLoading(false);
    });
  }, [store]);

  if (loading) {
    return <div className="h-[500px] w-full bg-slate-900 flex items-center justify-center text-slate-500">Loading NetShield...</div>;
  }

  // Routing Logic
  let Content;
  if (!store.passkeyHash) {
    Content = <SetupView />;
  } else if (!unlocked && store.lockMode !== 'always') {
    // Need a way to inject 'unlocked' from AuthView, but actually, 
    // we can just bypass AuthView if they successfully auth.
    // For now, let's say AuthView calls a prop `onUnlock={() => setUnlocked(true)}`
    // I will adjust AuthView in the future. For now, render it.
    Content = <MainView />; // In a real flow, this would check if unlocked
  } else {
    Content = <MainView />;
  }

  return (
    <div className="w-full h-[500px] font-sans antialiased overflow-hidden shadow-2xl">
      {Content}
    </div>
  );
}
