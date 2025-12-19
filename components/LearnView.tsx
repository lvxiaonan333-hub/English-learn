
import React, { useState, useEffect, useRef } from 'react';
import { Volume2, ChevronLeft, ChevronRight, Sparkles, Loader2 } from 'lucide-react';
import { WORD_PACKS } from '../constants';
import { generateDisneyImage, generatePronunciation, decodeAudioBuffer } from '../geminiService';
import { Word } from '../types';

interface LearnViewProps {
  category: string;
  onBack: () => void;
  onMastered: (id: string) => void;
  onComplete: () => void;
}

const LearnView: React.FC<LearnViewProps> = ({ category, onBack, onMastered, onComplete }) => {
  const pack = WORD_PACKS.find(p => p.name === category) || WORD_PACKS[0];
  const [currentIndex, setCurrentIndex] = useState(0);
  const [loading, setLoading] = useState(false);
  const [images, setImages] = useState<Record<string, string>>({});
  const audioCtxRef = useRef<AudioContext | null>(null);

  const currentWord = pack.words[currentIndex];

  useEffect(() => {
    loadContent(currentWord);
  }, [currentIndex]);

  const loadContent = async (word: Word) => {
    if (images[word.id]) return;
    
    setLoading(true);
    const imgUrl = await generateDisneyImage(word.en);
    if (imgUrl) {
      setImages(prev => ({ ...prev, [word.id]: imgUrl }));
    }
    setLoading(false);
  };

  const playAudio = async () => {
    if (navigator.vibrate) navigator.vibrate(15);
    if (!audioCtxRef.current) {
      audioCtxRef.current = new (window.AudioContext || (window as any).webkitAudioContext)();
    }
    
    const audioData = await generatePronunciation(currentWord.en);
    if (audioData) {
      const buffer = await decodeAudioBuffer(audioData, audioCtxRef.current);
      const source = audioCtxRef.current.createBufferSource();
      source.buffer = buffer;
      source.connect(audioCtxRef.current.destination);
      source.start();
    }
  };

  const handleNext = () => {
    if (navigator.vibrate) navigator.vibrate(10);
    onMastered(currentWord.id);
    if (currentIndex < pack.words.length - 1) {
      setCurrentIndex(prev => prev + 1);
    } else {
      onComplete();
    }
  };

  return (
    <div className="max-w-md mx-auto px-5 py-4 flex flex-col items-center gap-4 h-[calc(100svh-100px)] justify-center safe-pt">
      <div className="w-full flex justify-between items-center px-2">
        <button onClick={onBack} className="text-slate-400 p-2 flex items-center gap-1 font-black text-sm">
          <ChevronLeft size={20} /> 返回
        </button>
        <div className="bg-purple-50 px-3 py-1 rounded-full text-purple-500 font-black text-[10px] tracking-widest">
          {currentIndex + 1} / {pack.words.length}
        </div>
      </div>

      <div className="w-full flex-1 bg-white rounded-[2rem] p-4 sm:p-6 shadow-2xl relative overflow-hidden flex flex-col border-4 border-purple-50">
        {loading ? (
          <div className="flex-1 flex flex-col items-center justify-center gap-4 text-purple-400">
            <Loader2 className="animate-spin" size={40} />
            <p className="font-bold animate-pulse text-xs tracking-wider">正在召唤插图...</p>
          </div>
        ) : (
          <div className="flex-1 flex flex-col">
            <div className="relative flex-1 aspect-square w-full rounded-[1.5rem] overflow-hidden bg-slate-50">
              {images[currentWord.id] ? (
                <img 
                  src={images[currentWord.id]} 
                  alt={currentWord.en} 
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-slate-200">
                  <Sparkles size={64} />
                </div>
              )}
              <button 
                onClick={playAudio}
                className="absolute top-3 right-3 bg-white/90 backdrop-blur rounded-full p-4 shadow-xl text-purple-600 active:scale-90 transition-transform"
              >
                <Volume2 size={32} />
              </button>
            </div>

            <div className="py-6 text-center">
              <h2 className="text-4xl sm:text-5xl font-black text-slate-800 tracking-tight">{currentWord.en}</h2>
              <p className="text-xl sm:text-2xl text-purple-400 font-bold mt-1">{currentWord.cn}</p>
            </div>
          </div>
        )}
      </div>

      <div className="w-full flex gap-3 px-2">
        <button 
          onClick={() => setCurrentIndex(prev => Math.max(0, prev - 1))}
          className="flex-1 py-4 bg-slate-100 rounded-[1.2rem] font-black text-slate-400 active:bg-slate-200"
          disabled={currentIndex === 0}
        >
          上一个
        </button>
        <button 
          onClick={handleNext}
          className="flex-[2] py-4 bg-purple-600 text-white rounded-[1.2rem] font-black text-lg hover:bg-purple-700 shadow-xl shadow-purple-100 flex items-center justify-center gap-2"
        >
          {currentIndex === pack.words.length - 1 ? '完成学习' : '我记住了'} <ChevronRight size={20} />
        </button>
      </div>
    </div>
  );
};

export default LearnView;
