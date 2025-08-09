
export interface CallMetrics {
  latency: number;
  jitter: number;
  packetLoss: number;
  bandwidth: number;
  audioLevel: number;
  videoFrameRate: number;
  resolution: string;
  timestamp: Date;
}

export class CallOptimizer {
  private static metrics: CallMetrics[] = [];
  private static optimizationSettings = {
    autoAdjustQuality: true,
    prioritizeAudio: true,
    adaptiveBitrate: true,
    echoCancellation: true,
    noiseSuppression: true
  };

  static recordMetrics(metrics: Partial<CallMetrics>): void {
    const fullMetrics: CallMetrics = {
      latency: metrics.latency || 0,
      jitter: metrics.jitter || 0,
      packetLoss: metrics.packetLoss || 0,
      bandwidth: metrics.bandwidth || 0,
      audioLevel: metrics.audioLevel || 0,
      videoFrameRate: metrics.videoFrameRate || 30,
      resolution: metrics.resolution || '720p',
      timestamp: new Date()
    };

    this.metrics.push(fullMetrics);
    
    // Keep only last 100 metrics
    if (this.metrics.length > 100) {
      this.metrics.shift();
    }

    this.analyzeAndOptimize();
  }

  private static analyzeAndOptimize(): void {
    if (this.metrics.length < 5) return;

    const recent = this.metrics.slice(-5);
    const avgLatency = recent.reduce((sum, m) => sum + m.latency, 0) / recent.length;
    const avgPacketLoss = recent.reduce((sum, m) => sum + m.packetLoss, 0) / recent.length;
    const avgBandwidth = recent.reduce((sum, m) => sum + m.bandwidth, 0) / recent.length;

    const recommendations = this.generateRecommendations(avgLatency, avgPacketLoss, avgBandwidth);
    
    if (this.optimizationSettings.autoAdjustQuality) {
      this.applyOptimizations(recommendations);
    }
  }

  private static generateRecommendations(latency: number, packetLoss: number, bandwidth: number): string[] {
    const recommendations: string[] = [];

    if (latency > 150) {
      recommendations.push('High latency detected - Consider switching to audio-only mode');
    }

    if (packetLoss > 3) {
      recommendations.push('Packet loss detected - Reducing video quality');
    }

    if (bandwidth < 500) {
      recommendations.push('Low bandwidth - Optimizing for voice quality');
    }

    if (latency < 50 && packetLoss < 1 && bandwidth > 1000) {
      recommendations.push('Excellent connection - Enabling HD quality');
    }

    return recommendations;
  }

  private static applyOptimizations(recommendations: string[]): void {
    // This would integrate with WebRTC service to apply optimizations
    console.log('Applying call optimizations:', recommendations);
  }

  static getCallQualityScore(): number {
    if (this.metrics.length === 0) return 100;

    const recent = this.metrics.slice(-5);
    const avgLatency = recent.reduce((sum, m) => sum + m.latency, 0) / recent.length;
    const avgPacketLoss = recent.reduce((sum, m) => sum + m.packetLoss, 0) / recent.length;

    let score = 100;
    score -= Math.min(avgLatency / 2, 40); // Latency penalty
    score -= Math.min(avgPacketLoss * 10, 30); // Packet loss penalty

    return Math.max(score, 0);
  }

  static getNetworkSuggestions(): string[] {
    const score = this.getCallQualityScore();
    
    if (score > 80) return ['Your connection quality is excellent!'];
    if (score > 60) return ['Consider moving closer to your router', 'Close other bandwidth-intensive applications'];
    
    return [
      'Check your internet connection',
      'Try switching to a wired connection',
      'Close unnecessary applications',
      'Consider switching to audio-only mode'
    ];
  }
}
