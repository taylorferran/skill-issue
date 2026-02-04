type TimerListener = (elapsedTime: number) => void;

class TimerEventEmitter {
  private listeners: TimerListener[] = [];
  private currentTime: number = 0;
  private activeQuizId: string | null = null;

  subscribe(listener: TimerListener): () => void {
    console.log(`[TimerEmitter] ➕ Subscribe, total: ${this.listeners.length + 1}, activeQuiz: ${this.activeQuizId}`);
    
    this.listeners.push(listener);
    // Immediately notify with current time
    listener(this.currentTime);
    
    return () => {
      console.log(`[TimerEmitter] ➖ Unsubscribe, remaining: ${this.listeners.length - 1}`);
      this.listeners = this.listeners.filter(l => l !== listener);
    };
  }

  emit(time: number, quizId?: string): void {
    // Only emit if this is from the active quiz or no quiz is active
    if (quizId && this.activeQuizId && quizId !== this.activeQuizId) {
      console.log(`[TimerEmitter] ⛔ Ignoring emit from inactive quiz ${quizId}, active is ${this.activeQuizId}`);
      return;
    }
    
    this.currentTime = time;
    if (this.listeners.length > 0) {
      // Only log every 5 seconds to avoid spam
      if (time % 5 === 0 || time === 0) {
        console.log(`[TimerEmitter] 📢 Emit time=${time} to ${this.listeners.length} listeners`);
      }
      this.listeners.forEach(listener => listener(time));
    }
  }

  reset(quizId?: string): void {
    console.log(`[TimerEmitter] 🔄 Reset${quizId ? ` for quiz ${quizId}` : ''} (was time=${this.currentTime})`);
    this.currentTime = 0;
    
    // Set the active quiz ID if provided
    if (quizId) {
      this.activeQuizId = quizId;
      console.log(`[TimerEmitter] 🎯 Active quiz set to: ${quizId}`);
    }
    
    this.listeners.forEach(listener => listener(0));
  }

  getCurrentTime(): number {
    return this.currentTime;
  }
  
  getListenerCount(): number {
    return this.listeners.length;
  }
  
  clearActiveQuiz(): void {
    console.log(`[TimerEmitter] 🧹 Clearing active quiz: ${this.activeQuizId}`);
    this.activeQuizId = null;
    this.currentTime = 0;
  }
}

// Create a singleton instance for quiz timer events
export const quizTimerEmitter = new TimerEventEmitter();
