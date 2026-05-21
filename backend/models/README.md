# Model weights

`best.pt` is committed in this repo (~64MB) so Render/deploy gets weights on `git pull`.

To replace after retraining, overwrite `models/best.pt` and commit.

The server falls back to keyword classification if this file is missing.
