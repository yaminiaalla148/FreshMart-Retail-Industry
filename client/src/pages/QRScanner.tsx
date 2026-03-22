import { useState, useEffect, useRef } from "react";
import { useAuthStore, useBranches } from "@/hooks/use-auth";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useLocation } from "wouter";
import { QrCode, Camera, Loader2, ArrowLeft } from "lucide-react";
import { motion } from "framer-motion";
import type { Branch } from "@shared/schema";
import jsQR from "jsqr";

export default function QRScanner() {
  const { setBranch, user } = useAuthStore();
  const [, setLocation] = useLocation();
  const [manualQRInput, setManualQRInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [scannedBranch, setScannedBranch] = useState<Branch | null>(null);
  const [cameraActive, setCameraActive] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const { data: branches } = useBranches();

  useEffect(() => {
    if (user?.role === "hq_admin" || user?.role === "branch_manager") {
      setLocation("/");
    }
  }, [user, setLocation]);

  const startCamera = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: "environment" },
      });
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        setCameraActive(true);
        scanQRCode();
      }
    } catch (err) {
      setError("Unable to access camera. Please enable camera permissions.");
    }
  };

  const stopCamera = () => {
    if (videoRef.current?.srcObject) {
      const tracks = (videoRef.current.srcObject as MediaStream).getTracks();
      tracks.forEach((track) => track.stop());
      setCameraActive(false);
    }
  };

  const scanQRCode = async () => {
    if (!cameraActive || !canvasRef.current || !videoRef.current) return;

    const canvas = canvasRef.current;
    const context = canvas.getContext("2d") as CanvasRenderingContext2D;
    const video = videoRef.current;

    if (!context) return;

    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    context.drawImage(video, 0, 0, canvas.width, canvas.height);

    try {
      const imageData = context.getImageData(0, 0, canvas.width, canvas.height);
      const decoded = jsQR(imageData.data, imageData.width, imageData.height);

      if (decoded?.data) {
        const qrData = decoded.data;
        if (qrData.startsWith("BRANCH_")) {
          await handleQRScanned(qrData);
          return;
        }
      }
    } catch {
      // Continue scanning if decode fails
    }

    // Continue scanning
    requestAnimationFrame(scanQRCode);
  };

  const decodeQRCode = (imageData: ImageData): string | null => {
    try {
      const decoded = jsQR(imageData.data, imageData.width, imageData.height);
      return decoded?.data || null;
    } catch {
      return null;
    }
  };

  const handleQRScanned = async (qrId: string) => {
    try {
      setLoading(true);
      setError("");

      const response = await fetch(`/api/branches/qr/${qrId}`);
      if (!response.ok) throw new Error("Branch not found");

      const branch: Branch = await response.json();
      setScannedBranch(branch);
      setBranch(branch);
      stopCamera();
      
      // Automatically navigate to shop after successful scan
      setTimeout(() => {
        setLocation("/shop");
      }, 500);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to scan QR code");
    } finally {
      setLoading(false);
    }
  };

  const handleManualQR = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!manualQRInput.trim()) return;

    await handleQRScanned(manualQRInput.trim());
  };

  const handleEnterBranch = () => {
    if (scannedBranch) {
      setLocation("/shop");
    }
  };

  const handleBack = () => {
    stopCamera();
    setLocation("/");
  };

  return (
    <div className="min-h-screen bg-background pt-20 pb-12 px-4 md:px-8">
      <div className="max-w-2xl mx-auto">
        <Button
          variant="ghost"
          onClick={handleBack}
          className="mb-6 flex items-center gap-2"
        >
          <ArrowLeft className="w-4 h-4" />
          Back
        </Button>

        {!scannedBranch ? (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="space-y-6"
          >
            <div className="text-center mb-8">
              <div className="w-20 h-20 bg-primary/10 rounded-2xl flex items-center justify-center mx-auto mb-4">
                <QrCode className="w-10 h-10 text-primary" />
              </div>
              <h1 className="text-3xl md:text-4xl font-bold text-secondary mb-2">
                Scan Store QR Code
              </h1>
              <p className="text-muted-foreground">
                Scan the QR code displayed at the store entrance to access that branch
              </p>
            </div>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Camera className="w-5 h-5 text-primary" />
                  Camera Scanner
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {!cameraActive ? (
                  <Button
                    onClick={startCamera}
                    className="w-full h-12 rounded-xl"
                    disabled={loading}
                  >
                    {loading ? (
                      <>
                        <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                        Processing...
                      </>
                    ) : (
                      <>
                        <Camera className="mr-2 h-5 w-5" />
                        Start Camera
                      </>
                    )}
                  </Button>
                ) : (
                  <div className="space-y-4">
                    <div className="relative w-full bg-black rounded-xl overflow-hidden aspect-square">
                      <video
                        ref={videoRef}
                        autoPlay
                        playsInline
                        className="w-full h-full object-cover"
                      />
                      <canvas
                        ref={canvasRef}
                        className="hidden"
                      />
                      <div className="absolute inset-0 border-2 border-primary rounded-xl pointer-events-none" />
                      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2">
                        <div className="w-48 h-48 border-2 border-primary rounded-lg opacity-50" />
                      </div>
                    </div>
                    <Button
                      onClick={stopCamera}
                      variant="outline"
                      className="w-full h-12 rounded-xl"
                    >
                      Cancel Scan
                    </Button>
                  </div>
                )}

                {error && (
                  <div className="p-3 rounded-lg bg-red-50 text-red-600 text-sm border border-red-100">
                    {error}
                  </div>
                )}
              </CardContent>
            </Card>

            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-muted" />
              </div>
              <div className="relative flex justify-center text-sm">
                <span className="px-2 bg-background text-muted-foreground">Or enter manually</span>
              </div>
            </div>

            <Card>
              <CardHeader>
                <CardTitle>Manual QR Code Entry</CardTitle>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleManualQR} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="qr-code">QR Code ID</Label>
                    <Input
                      id="qr-code"
                      placeholder="e.g., BRANCH_1"
                      value={manualQRInput}
                      onChange={(e) => setManualQRInput(e.target.value)}
                      className="rounded-xl h-12"
                    />
                  </div>
                  <Button
                    type="submit"
                    className="w-full h-12 rounded-xl"
                    disabled={loading || !manualQRInput.trim()}
                  >
                    {loading ? (
                      <>
                        <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                        Scanning...
                      </>
                    ) : (
                      "Enter Store"
                    )}
                  </Button>
                </form>
              </CardContent>
            </Card>

            {branches && branches.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle>Available Stores</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    {branches.map((branch: Branch) => (
                      <Button
                        key={branch.id}
                        variant="outline"
                        className="w-full justify-start h-auto p-4 rounded-xl"
                        onClick={() => handleQRScanned(`BRANCH_${branch.id}`)}
                      >
                        <div className="text-left">
                          <p className="font-semibold">{branch.name}</p>
                          <p className="text-xs text-muted-foreground">
                            {branch.address || "No address"}
                          </p>
                        </div>
                      </Button>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}
          </motion.div>
        ) : (
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="text-center space-y-6"
          >
            <div className="space-y-2">
              <div className="w-20 h-20 bg-green-100 rounded-2xl flex items-center justify-center mx-auto">
                <QrCode className="w-10 h-10 text-green-600" />
              </div>
              <h2 className="text-2xl font-bold text-secondary">
                Welcome to {scannedBranch.name}!
              </h2>
              <p className="text-muted-foreground">
                QR code scanned successfully. You're now connected to this store.
              </p>
            </div>

            <Card className="bg-green-50 border-green-200">
              <CardContent className="pt-6 space-y-3 text-left">
                <div className="flex items-start gap-3">
                  <div className="w-2 h-2 bg-green-600 rounded-full mt-2" />
                  <div>
                    <p className="font-semibold text-green-900">
                      {scannedBranch.name}
                    </p>
                    <p className="text-sm text-green-700">
                      {scannedBranch.address || "Location details"}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Button
              onClick={handleEnterBranch}
              className="w-full h-12 rounded-xl text-lg font-semibold"
            >
              Enter Store
            </Button>

            <Button
              onClick={() => {
                setScannedBranch(null);
                setManualQRInput("");
                setError("");
              }}
              variant="outline"
              className="w-full h-12 rounded-xl"
            >
              Scan Another QR Code
            </Button>
          </motion.div>
        )}
      </div>
    </div>
  );
}
