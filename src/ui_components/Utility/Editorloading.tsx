function Editorloading() {
  return (
    <div className="relative h-[calc(100vh-140px)] w-full overflow-hidden bg-background border rounded-2xl m-4 mx-auto max-w-[calc(100%-32px)]">
              {/* Grid background (React Flow feel) */}
              <div className="absolute inset-0 bg-[radial-gradient(circle_at_1px_1px,theme(colors.muted)_1px,transparent_0)] bg-size-[32px_32px] opacity-40" />

              {/* Skeleton Nodes with Floating Animation */}
              <div className="relative h-full w-full flex items-center justify-center">
                  <div className="relative w-full h-full max-w-4xl max-h-[600px]">
                      
                      {/* Node 1 - Trigger */}
                      <div className="absolute top-[10%] left-[10%] w-60 h-32 bg-linear-to-br from-muted/50 to-muted/20 backdrop-blur-md rounded-2xl shadow-xl border border-white/5 animate-float" style={{ animationDelay: '0s' }}>
                          <div className="p-4 space-y-3">
                              <div className="h-4 w-24 bg-primary/20 rounded-full animate-pulse" />
                              <div className="space-y-2">
                                  <div className="h-3 w-full bg-muted rounded-full" />
                                  <div className="h-3 w-2/3 bg-muted rounded-full" />
                              </div>
                          </div>
                      </div>
                      
                      {/* Node 2 - Middle Action */}
                      <div className="absolute top-[40%] right-[15%] w-64 h-36 bg-linear-to-br from-muted/50 to-muted/20 backdrop-blur-md rounded-2xl shadow-xl border border-white/5 animate-float" style={{ animationDelay: '1.5s' }}>
                          <div className="p-4 space-y-4">
                              <div className="h-5 w-5 bg-primary/30 rounded-lg animate-pulse" />
                              <div className="space-y-2">
                                  <div className="h-3 w-full bg-muted rounded-full" />
                                  <div className="h-3 w-full bg-muted rounded-full" />
                                  <div className="h-3 w-1/2 bg-muted rounded-full" />
                              </div>
                          </div>
                      </div>
                      
                      {/* Node 3 - Final Action */}
                      <div className="absolute bottom-[10%] left-[40%] -translate-x-1/2 w-72 h-32 bg-linear-to-br from-muted/50 to-muted/20 backdrop-blur-md rounded-2xl shadow-xl border border-white/5 animate-float" style={{ animationDelay: '0.7s' }}>
                          <div className="p-4 flex items-center gap-4 h-full">
                              <div className="h-12 w-12 bg-muted/80 rounded-xl" />
                              <div className="flex-1 space-y-2">
                                  <div className="h-3 w-full bg-muted rounded-full" />
                                  <div className="h-3 w-3/4 bg-muted rounded-full" />
                              </div>
                          </div>
                      </div>

                      {/* Animated connecting lines (SVG) */}
                      <svg className="absolute inset-0 w-full h-full pointer-events-none opacity-20" preserveAspectRatio="none">
                          <path d="M 220 120 Q 400 120 550 240" fill="none" stroke="currentColor" strokeWidth="2" strokeDasharray="8 8" className="text-muted-foreground animate-[dash_30s_linear_infinite]" />
                          <path d="M 550 380 Q 400 480 320 480" fill="none" stroke="currentColor" strokeWidth="2" strokeDasharray="8 8" className="text-muted-foreground animate-[dash_30s_linear_infinite]" />
                      </svg>
                  </div>
              </div>

              {/* Center text with premium look */}
              <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                  <div className="bg-background/80 backdrop-blur-xl px-8 py-4 rounded-2xl border shadow-2xl flex flex-col items-center gap-3 animate-in fade-in zoom-in duration-500">
                      <div className="flex gap-1.5">
                          <div className="w-2 h-2 rounded-full bg-primary animate-bounce" style={{ animationDelay: '0s' }} />
                          <div className="w-2 h-2 rounded-full bg-primary animate-bounce" style={{ animationDelay: '0.2s' }} />
                          <div className="w-2 h-2 rounded-full bg-primary animate-bounce" style={{ animationDelay: '0.4s' }} />
                      </div>
                      <span className="text-sm font-semibold tracking-tight text-foreground/80">
                          Initializing Editor Workspace
                      </span>
                  </div>
              </div>
          </div>
  )
}

export default Editorloading