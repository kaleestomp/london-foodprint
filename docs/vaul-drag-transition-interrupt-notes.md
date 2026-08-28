# Vaul Drag Transition Interrupt Notes

This note documents the three changes made while investigating rapid re-grab behavior in `vaul`.

## Context

The target behavior was:

1. If the drawer is animating toward a snap point, a new pointer-down during that transition should still be accepted.
2. That new gesture should stop the current animation immediately.
3. The drawer should then continue moving with the pointer from its current visual position, rather than waiting for the original animation to finish.

The work was done against the local installed package file:

- `node_modules/vaul/dist/index.mjs`

This means the fix is effective locally, but it is not durable across reinstall unless moved into a maintained patch workflow.

## Step 1: Interrupt Transition On Pointer Down
"I’ve got the narrow fix: detect when the drawer is already animating, immediately cancel the transition on pointer-down, and mark that gesture as drag-allowed so the first move is not discarded. 
Edited
index.mjs+13-0
I’ve applied the runtime behavior change; I’m verifying the patched onPress block is in place before I summarize the effect.

I patched Vaul so a pointer-down during an active snap transition now immediately cancels the animation and treats that gesture as drag-allowed.

The change is in index.mjs: when the drawer is transitioning, onPress now sets both drawer and overlay transitions to none and sets isAllowedToDrag.current = true before the drag move starts. That should address the “rapid re-grab” miss you were seeing.

I verified the patched block is present in the file. If you want, I can also make the same change in the source entry you own, or turn this into a durable patch file so it survives reinstalling dependencies."
### Goal

Allow a second gesture to start even if the drawer is already mid-transition.

### Problem Observed

During a snap animation, the drawer could recognize the new press, but the early movement of the second gesture was effectively lost. The drawer remained committed to the in-flight transition instead of handing control back to the user.

### Change Made

Inside `onPress`, transition state was detected from the computed style of the drawer element.

When the drawer was found to be transitioning:

1. The drawer transition was set to `none`.
2. The overlay transition was set to `none`.
3. The gesture was marked as immediately drag-allowed by setting `isAllowedToDrag.current = true`.

### Why This Was Necessary

Without this change, a new press during an existing snap animation still had to pass through the normal drag gating path before movement took control. That created a lagging feel and made the second gesture appear ignored.

This first change fixed the recognition problem at the start of the gesture. It established the rule that a new pointer-down is allowed to interrupt an active transition.

### Limitation Of Step 1

This change alone was not sufficient. Even though the animation was cancelled at press time, the drawer still did not always move with the pointer immediately, because the subsequent drag calculations were still anchored to the prior snap-point state.

## Step 2: Add Drag Start Offset For Mid-Flight Re-Grabs
"I found the missing piece: the drag math still anchors to the last snap point, so a re-grab during motion needs a positional offset, not just [transition: none](vscode-file://vscode-app/c:/Program%20Files/Microsoft%20VS%20Code/7e7950df89/resources/app/out/vs/code/electron-browser/workbench/workbench.html). I’m adding that offset and resetting it on release so the pointer can take over mid-flight. 
Edited
index.mjs+11-2
I’ve wired the drag offset through the release/press path now; I’m doing a quick readback of the changed blocks to ensure the computed translation and offset math are coherent.

I changed the drag math so a re-grab during a running snap transition now behaves like a true interruption, not a deferred drag.

What changed in index.mjs:

On pointer-down during a live transition, the drawer now freezes at its current transform immediately.
A dragStartOffset is carried into the drag calculation so movement continues from the in-flight position instead of snapping back to the last snap anchor.
That offset is reset on release/cancel.
So the expected behavior is now:

press during animation
animation stops immediately
the next pointer move takes over the drawer from where it currently is
I checked the patched blocks to make sure the offset is wired into onPress, onDrag, and release cleanup. If you want, I can also help turn this into a durable patch outside node_modules so it survives reinstalling dependencies.
"
### Goal

Make a re-grab continue smoothly from the drawer's current visual position while it is mid-animation.

### Problem Observed

After Step 1, the drawer could stop the transition, but drag math was still based on the active snap point rather than the actual current translated position of the drawer at the moment the new gesture began.

That meant the pointer and drawer were using different coordinate origins:

1. The user was grabbing the drawer at its visible in-flight position.
2. The drag logic was still measuring from the snap-point anchor.

This mismatch caused the second gesture to feel delayed, ignored, or disconnected until the previous motion had effectively resolved.

### Change Made

A new `dragStartOffset` ref was introduced.

On transition interruption inside `onPress`:

1. The current translated drawer position was read using `getTranslate(drawerRef.current, direction)`.
2. The difference between the current visual position and the active snap-point offset was stored in `dragStartOffset.current`.
3. The drawer transform was frozen at the current translated position so the visual position and the drag baseline matched.

Then, inside `onDrag`, the gesture distance was adjusted by that stored offset:

```js
const draggedDistance =
  (pointerStart.current - (isVertical(direction) ? event.pageY : event.pageX)) * directionMultiplier
  + dragStartOffset.current;
```

The offset was cleared again in both `cancelDrag` and `onRelease`.

### Why This Was Necessary

The transition interruption in Step 1 only stopped CSS animation. It did not solve the coordinate mismatch between:

1. where the drawer visually was,
2. where the drag engine thought the drawer started.

By carrying a positional offset into drag math, the second gesture could take control from the exact in-flight location instead of from the stale snap anchor.

### Result Of Step 2

This made re-grabs during animation continuous rather than deferred. The drawer could now be pressed during motion and continue following the pointer from its live visual position.

### Limitation Of Step 2

There was still another source of interference: a render-time effect inside `useSnapPoints` could reapply the controlled snap-point transform while the user was already dragging.

## Step 3: Stop Controlled Snap Sync From Fighting Active Drag
"I found the likely conflict: a render-time effect is reapplying the controlled snap point while you’re trying to interrupt the animation. I’m gating that sync off during active drag so the pointer can truly take over mid-flight. 
Edited

index.mjs+4-2
The sync-to-snap effect is now disabled while dragging, which should stop the drawer from snapping itself back during a mid-transition re-grab. I’m verifying the updated hook signature and guard.

Yes. The drawer was still being re-synced to its controlled snap point while you were dragging, so the in-flight transition kept winning over the new downward gesture.

I changed index.mjs so the snap-point sync effect now bails out while isDragging is true. That lets a drag started during animation actually take control of the drawer instead of being overwritten by the previous snap state.

If you want this to survive reinstalling node_modules, I can turn the same fix into a durable patch file or move the behavior into a local fork.
"
### Goal

Prevent the controlled snap-point effect from overwriting an interrupted drag.

### Problem Observed

Even after Steps 1 and 2, there was still a conflict between:

1. the user trying to take over the drawer mid-flight, and
2. the `useSnapPoints` effect continuing to drive the drawer toward the current controlled `activeSnapPoint`.

In practice, this meant the drag interrupt could start correctly, but then the snap synchronization effect could reassert itself and push the drawer back toward its previous target.

### Change Made

The `useSnapPoints` hook was extended to accept `isDragging`.

Then the effect that synchronizes the drawer to the current `activeSnapPoint` was guarded so it exits early while a drag is in progress:

```js
React__default.useEffect(() => {
  if (isDragging) return;

  if (activeSnapPoint || activeSnapPointProp) {
    ...
  }
}, [...]);
```

The hook call from `Root` was updated to pass the current `isDragging` state.

### Why This Was Necessary

The earlier fixes gave the user a way to interrupt the animation, but the controlled snap sync still had authority to immediately restore the previous snap transform during render/effect timing.

That made the system behave as if two controllers were competing:

1. pointer-driven drag,
2. effect-driven snap synchronization.

Pausing the sync while dragging ensures that only one controller owns the transform at a time.

### Result Of Step 3

This completed the behavior change:

1. The drawer accepts pointer-down during an active transition.
2. The current animation is interrupted immediately.
3. Drag motion continues from the drawer's actual in-flight position.
4. The snap-sync effect stays out of the way until the drag finishes.

## Final Assessment

The three changes solve different layers of the same interaction problem:

1. Step 1 solved gesture admission during animation.
2. Step 2 solved positional continuity during a mid-flight handoff.
3. Step 3 solved state synchronization fighting the user-controlled drag.

All three are part of the final working behavior. Removing any one of them risks reintroducing a different variant of the original issue.

## Maintenance Note

Because the edits were made directly in `node_modules/vaul/dist/index.mjs`, they are local and fragile.

Recommended follow-up:

1. move these changes into a durable patch workflow such as `patch-package`, or
2. fork the dependency and reference the fork explicitly.