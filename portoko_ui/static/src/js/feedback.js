/** @odoo-module **/
// Scan feedback in three layers: the screen changes, a sound plays, the device vibrates.
// Sound needs one user gesture first (browser rule); scans from a hardware scanner count as one.

const TONES = {
    ok: { freqs: [1760], dur: 0.08, vibrate: 40 },
    done: { freqs: [1320, 1760], dur: 0.08, vibrate: [40, 40, 40] },
    warn: { freqs: [880, 660], dur: 0.12, vibrate: [80, 60, 80] },
    stop: { freqs: [330, 247], dur: 0.18, vibrate: [200, 80, 200] },
    tap: { freqs: [660], dur: 0.04, vibrate: 0 },
};

let audio = null;

function playTone(freqs, dur) {
    try {
        audio = audio || new (window.AudioContext || window.webkitAudioContext)();
        if (audio.state === "suspended") {
            audio.resume();
        }
        const t = audio.currentTime;
        freqs.forEach((f, i) => {
            const osc = audio.createOscillator();
            const gain = audio.createGain();
            osc.type = "square";
            osc.frequency.value = f;
            gain.gain.setValueAtTime(0.0001, t + i * dur);
            gain.gain.exponentialRampToValueAtTime(0.07, t + i * dur + 0.01);
            gain.gain.exponentialRampToValueAtTime(0.0001, t + (i + 1) * dur);
            osc.connect(gain).connect(audio.destination);
            osc.start(t + i * dur);
            osc.stop(t + (i + 1) * dur + 0.02);
        });
    } catch {
        // no audio device: the visual layer still shows the result
    }
}

/**
 * @param {"ok"|"done"|"warn"|"stop"|"tap"} kind
 * @param {{sound?: boolean, vibrate?: boolean, el?: HTMLElement}} [opts]
 */
export function feedback(kind, opts = {}) {
    const tone = TONES[kind] || TONES.ok;
    if (opts.sound !== false) {
        playTone(tone.freqs, tone.dur);
    }
    if (opts.vibrate !== false && tone.vibrate && navigator.vibrate) {
        navigator.vibrate(tone.vibrate);
    }
    if (opts.el) {
        flash(opts.el);
    }
}

export function flash(el) {
    el.classList.remove("ptk-flash");
    void el.offsetWidth;
    el.classList.add("ptk-flash");
}
