
import React, { useState, useEffect } from 'react';
import { ChevronLeft, CheckCircle2, XCircle, Trophy, Star } from 'lucide-react';
import { WORD_PACKS } from '../constants';
import { Word } from '../types';

interface TestViewProps {
  onBack: () => void;
  onResult: (score: number) => void;
}

const TestView: React.FC<TestViewProps> = ({ onBack, onResult }) => {
  const [questions, setQuestions] = useState<{word: Word, options: string[]}[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [answers, setAnswers] = useState<string[]>([]);
  const [showSummary, setShowSummary] = useState(false);

  useEffect(() => {
    const allWords = WORD_PACKS.flatMap(p => p.words);
    const testSet = [...allWords].sort(() => Math.random() - 0.5).slice(0, 10);
    
    const prepared = testSet.map(word => {
      const distractors = allWords
        .filter(w => w.en !== word.en)
        .sort(() => Math.random() - 0.5)
        .slice(0, 2)
        .map(w => w.en);
      return {
        word,
        options: [word.en, ...distractors].sort(() => Math.random() - 0.5)
      };
    });

    setQuestions(prepared);
  }, []);

  const handleAnswer = (choice: string) => {
    const newAnswers = [...answers, choice];
    setAnswers(newAnswers);
    if (currentIndex < questions.length - 1) {
      setCurrentIndex(currentIndex + 1);
    } else {
      setShowSummary(true);
      const score = newAnswers.reduce((acc, ans, i) => 
        ans === questions[i].word.en ? acc + 1 : acc, 0);
      onResult(score * 5);
    }
  };

  if (showSummary) {
    const score = answers.reduce((acc, ans, i) => 
      ans === questions[i].word.en ? acc + 1 : acc, 0);

    return (
      <div className="max-w-2xl mx-auto p-6 space-y-8">
        <div className="text-center space-y-4">
          <div className="w-24 h-24 bg-purple-100 rounded-full flex items-center justify-center mx-auto text-purple-600 shadow-inner">
            <Trophy size={48} />
          </div>
          <h2 className="text-4xl font-black">王国小测试完成！</h2>
          <p className="text-slate-500">你获得了 {score * 5} 颗魔法星星！</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {questions.map((q, i) => (
            <div key={i} className="bg-white p-5 rounded-2xl border-2 border-slate-100 flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="w-10 h-10 rounded-full bg-slate-50 flex items-center justify-center text-slate-400 font-bold">
                  {i+1}
                </div>
                <div>
                  <div className="font-bold text-slate-800">{q.word.cn}</div>
                  <div className={`text-sm ${answers[i] === q.word.en ? 'text-green-500' : 'text-red-400'}`}>
                    {answers[i]}
                  </div>
                </div>
              </div>
              {answers[i] === q.word.en ? (
                <CheckCircle2 className="text-green-500" />
              ) : (
                <XCircle className="text-red-400" />
              )}
            </div>
          ))}
        </div>

        <button 
          onClick={onBack}
          className="w-full py-5 bg-purple-600 text-white rounded-2xl font-bold text-xl shadow-xl"
        >
          返回乐园首页
        </button>
      </div>
    );
  }

  const currentQ = questions[currentIndex];
  if (!currentQ) return null;

  return (
    <div className="max-w-xl mx-auto p-6 space-y-12 flex flex-col min-h-[80vh] justify-center">
      <div className="space-y-2">
        <div className="flex justify-between text-sm font-bold text-slate-400 uppercase tracking-widest">
          <span>每日小测验</span>
          <span>{currentIndex + 1} / {questions.length}</span>
        </div>
        <div className="h-3 bg-slate-100 rounded-full overflow-hidden">
          <div 
            className="h-full bg-gradient-to-r from-purple-500 to-pink-500 transition-all duration-500"
            style={{ width: `${((currentIndex + 1) / questions.length) * 100}%` }}
          />
        </div>
      </div>

      <div className="bg-white p-12 rounded-[3rem] shadow-2xl border-4 border-purple-50 text-center space-y-6">
        <p className="text-slate-400 font-bold uppercase text-sm">翻译成英语</p>
        <h3 className="text-7xl font-black text-slate-800">{currentQ.word.cn}</h3>
      </div>

      <div className="grid grid-cols-1 gap-4">
        {currentQ.options.map((opt, i) => (
          <button
            key={i}
            onClick={() => handleAnswer(opt)}
            className="group py-5 px-8 rounded-3xl bg-white border-2 border-slate-100 hover:border-purple-300 transition-all flex items-center justify-between"
          >
            <span className="text-2xl font-bold text-slate-700 group-hover:text-purple-600">{opt}</span>
            <div className="w-10 h-10 rounded-xl bg-slate-50 group-hover:bg-purple-100 flex items-center justify-center text-slate-400 group-hover:text-purple-600 font-bold">
              {String.fromCharCode(65 + i)}
            </div>
          </button>
        ))}
      </div>
    </div>
  );
};

export default TestView;
