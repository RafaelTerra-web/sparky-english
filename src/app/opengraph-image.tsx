import { ImageResponse } from "next/og";

export const alt = "Sparky English";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default function OpenGraphImage() {
  return new ImageResponse(
    (
      <div
        style={{
          alignItems: "center",
          background: "#172b32",
          color: "#f8f4ed",
          display: "flex",
          height: "100%",
          justifyContent: "space-between",
          padding: "72px 82px",
          position: "relative",
          width: "100%",
        }}
      >
        <div style={{ display: "flex", flexDirection: "column", maxWidth: 650 }}>
          <div style={{ color: "#f3a16c", display: "flex", fontSize: 26, letterSpacing: 5, textTransform: "uppercase" }}>
            Espaço privado
          </div>
          <div style={{ display: "flex", fontSize: 76, fontWeight: 700, letterSpacing: -3, marginTop: 22 }}>
            Sparky English
          </div>
          <div style={{ color: "#c7d5d0", display: "flex", fontSize: 30, lineHeight: 1.35, marginTop: 28 }}>
            Aulas, prática e revisão para o inglês do dia a dia.
          </div>
        </div>
        <div style={{ alignItems: "center", background: "#e78554", borderRadius: 92, display: "flex", height: 240, justifyContent: "center", position: "relative", width: 240 }}>
          <div style={{ background: "#1e2932", borderRadius: 46, display: "flex", height: 112, left: 17, position: "absolute", top: 17, width: 112 }} />
          <div style={{ background: "#1e2932", borderRadius: 46, display: "flex", height: 112, position: "absolute", right: 17, top: 17, width: 112 }} />
          <div style={{ alignItems: "center", background: "#f8f4ed", borderRadius: 80, display: "flex", height: 158, justifyContent: "center", marginTop: 38, width: 174 }}>
            <div style={{ alignItems: "center", background: "#172b32", borderRadius: 999, color: "#f8f4ed", display: "flex", fontSize: 42, fontWeight: 700, height: 80, justifyContent: "center", width: 80 }}>S</div>
          </div>
        </div>
      </div>
    ),
    size,
  );
}
