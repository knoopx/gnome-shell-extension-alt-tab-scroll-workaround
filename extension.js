// Copyright (C) 2022  Lucas Emanuel Resck
// Copyright (C) 2022  vakokako
// Copyright (C) 2021  Taiki Sugawara

// This program is free software: you can redistribute it and/or modify
// it under the terms of the GNU General Public License as published by
// the Free Software Foundation, either version 3 of the License, or
// (at your option) any later version.

// This program is distributed in the hope that it will be useful,
// but WITHOUT ANY WARRANTY; without even the implied warranty of
// MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
// GNU General Public License for more details.

// You should have received a copy of the GNU General Public License
// along with this program.  If not, see <http://www.gnu.org/licenses/>.

import Clutter from "gi://Clutter";

import * as altTab from "resource:///org/gnome/shell/ui/altTab.js";

function patch(target, name, fn) {
    const orig = target[name];
    target[name] = fn(orig);
    return () => {
        target[name] = orig;
    };
}

class Extension {
    constructor() {
        const seat = Clutter.get_default_backend().get_default_seat();
        this.vdevice = seat.create_virtual_device(
            Clutter.InputDeviceType.POINTER_DEVICE,
        );

        this.patches = [
            patch(altTab.WindowSwitcherPopup, "_finish", (orig) => () => {
                this.movePointer();
                orig();
            }),

            patch(altTab.AppSwitcherPopup, "_finish", (orig) => (timestamp) => {
                if (this._currentWindow < 0) {
                    this.movePointer();
                }
                orig(timestamp);
            }),
        ];
    }

    movePointer() {
        const [x, y] = global.get_pointer();
        this.vdevice.notify_absolute_motion(global.get_current_time(), x, y);
    }

    unpatch() {
        this.patches.forEach((unpatch) => unpatch());
    }
}

let extension = null;
export default class {
    enable() {
        extension = new Extension();
    }

    disable() {
        extension.unpatch();
        extension = null;
    }
}
