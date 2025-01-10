# ioBroker_Helios-KWL

_[(English instructions)](#English)_

_Helios KWL ist eine Lüftungsanlage mit Wärmerückgewinnung, die über einen Webserver verfügt. Dadurch lässt sich die Anlage mit anderen Geräten ansteuern, die sich ebenfalls im Netzwerk befinden._

**Was?** Dieses Script ist für ioBroker gedacht und verbindet sich mit einer Helios KWL Anlage, um die aktuellen Werte, wie Temperaturen und Lüfterstufe, auszulesen und auch selbst Einstellungen vornehmen zu können.

**Warum?** Helios KWL wird mit einer eigenen Web-Oberfläche ("Helios easyControls") ausgeliefert, doch diese sieht mittlerweile veraltet aus und ist nicht für Mobilgeräte optimiert. Zusätzlich wollte ich die Lüftungsanlage in mein Smart-home integrieren, damit ich diese dynamischer ansteuern kann. So lässt sich nun die Lüfterstufe je nach Anzahl der Personen im Haushalt und der aktuellen Temperaturen ändern.

**Wie?** Der Code ist zwar in Englisch dokumentiert, aber in leichter Sprache gehalten und auch nicht zu komplex programmiert. Kurzfassung: Das Script lädt die aktuellen Werte aus diversen XML-Dateien, aktualisiert die entsprechenden Datenpunkte in ioBroker und sendet ggfs. eigene Werte zurück an die Anlage, um Einstellungen zu setzen.

![VIS](/img/visualisation.PNG)

Einbindung der Temperatursensoren und der Lüftersteuerung in VIS



## Hardware

- Helios KWL EC 200W R (Sollte für alle Modelle mit Helios easyControls funktionieren. Register könnten sich jedoch unterscheiden!)
- Server mit ioBroker **(Wichtig: Es muss mindestens der Javascript-Adapter v7.9.0 installiert sein!)**
- Optional: TP-Link TL-WR802N Router (https://www.amazon.de/dp/B00TQEX8BO/)
  Ich brauchte diesen Mini-Router, weil ich kein LAN-Kabel zum eigentlichen Router verlegen konnte und auf diese Weise eine WLAN-Brücke aufgebaut habe. Sehr empfehlenswert und leicht einzurichten.



## "Installation"

1. Neues Javascript im ioBroker erstellen
2. Code aus diesem Repository einfügen
3. IP-Adresse, Passwort und gewünschte Datenpunkte ändern
4. Speichern und starten

![Datapoints](/img/datapoints.PNG)

## Weitere Datenpunkte hinzufügen

Zu Beginn des Codes werden die gewünschten Datenpunkte eingetragen, die dann beim nächsten Start automatisch angelegt werden. Die wichtigsten sind bereits vorhanden, doch wenn man weitere Datenpunkte braucht, muss man lediglich das entsprechende Register angeben und einen eigenen Namen vergeben.

Beispiel:

```javascript
const datapoint_names = {
  "v00102": "Luefterstufe_IST",         // Fan speed
  // ...
  
  // "Register": "Name for the datapoint" (I'm using "vxxxxx" for actual registers and "wxxxxx" for custom datapoints)
}
```

In dem Register `v00102` ist der Wert für die aktuelle Lüfterstufe (0 bis 4) gespeichert und der Datenpunkt wird unter `HeliosKWL.Luefterstufe_IST` hinterlegt.  Das Präfix kann ebenfalls zu Beginn des Codes geändert werden.



## Werte ändern / Einstellungen vornehmen

Im Fall der Lüfterstufe habe ich zwei Datenpunkte angelegt, ein IST- und ein SOLL-Wert. Der IST-Wert ist die aktuelle Stufe, die von der Anlage übermittelt wird und der SOLL-Wert ist die von mir gewünschte Stufe. Wenn `Luefterstufe_SOLL` geändert wird, dann wird dieser Wert an die Anlage gesendet, welche dann die entsprechende Lüfterstufe einstellt und wiederum `Luefterstufe_IST` aktualisiert. Mit der Funktion `setValues(path, values)` lassen sich weitere Register mit den entsprechenden Werten setzen. Hier ein Beispiel, wie die Lüfterstufe auf Stufe 2 gesetzt wird:

```javascript
setValues("info", "v00102=2");
```

- `info` ist der Pfad, unter dem das Register hinterlegt ist
- `v00102=2` setzt das Register `v00102` auf `2`, was der Lüfterstufe entspricht
- Es lassen sich mehrere Register gleichzeitig setzen, z.B. `setValues("info", "v00102=2", "v00xxx=100", "v00yyy=50");`. Hinweis: Der Pfad muss für diese Register derselbe sein.



## Sonstige Funktionen

### Partybetrieb

Standardmäßig wird vom Script der Datenpunkt `Partybetrieb_SOLL` angelegt, mit dem sich der Partybetrieb vereinfacht aktivieren/deaktivieren lässt. Der String besteht aus drei Zahlen, die durch Semikolons getrennt sind. Die erste Zahl (`0` oder `1`) aktiviert/deaktiviert den Partybetrieb; die zweite gibt die Dauer an (`1` bis `180`) und die dritte die gewünschte Lüfterstufe (`0` bis `4`).

Hier ein paar Beispiele:

| String |                                         Bedeutung                                         |
|:------:|:-----------------------------------------------------------------------------------------:|
| 1;20;4 |                    Partybetrieb einschalten; Dauer 20 Minuten; Stufe 4                    |
| 0;20;4 | Partybetrieb ausschalten (restliche Parameter setzen dennoch die entsprechenden Register) |
| 2;20;4 |                                         Ungültig                                          |

### Restlaufzeit für Filterwechsel zurücksetzen

Die Restlaufzeit wird jeden Monat automatisch zurückgesetzt. Der Code-Abschnitt dafür befindet sich unten in der Sektion "SCHEDULES". Das Intervall wird über CRON gesteuert.

### Wochenplan über ioBroker

Helios KWL kommt zwar schon mit einem programmierbaren Wochenplan, doch diesen habe ich ins Script ausgelagert, um mehr Freiheiten zu haben. Standardmäßig wird die Anlage um 23 Uhr auf Lüfterstufe 2 gestellt und um 6 Uhr morgens auf Lüfterstufe 0.

Zwischen 23 und 6 Uhr wird alle 30 Minuten erneut auf Stufe 2 gesetzt, damit eine Änderung durch den Benutzer wieder auf den Wochenplan zurückgesetzt wird. Zwischen 6 und 23 Uhr geschieht dies jede Stunde. Dieser Wochenplan lässt sich aber, wie alles andere, selbst ändern und an die eigenen Wünsche anpassen.



---

Danke an die Leute aus dem ioBroker-Forum, die sich vor mir mit diesem Thema auseinandergesetzt und den Stein ins Rollen gebracht haben :)

https://forum.iobroker.net/topic/24769/gel%C3%B6st-helios-kwl-zugriff-auf-xml

---





## English

_Helios KWL is a ventilation system with heat recovery that is equipped with a webserver and can be controlled from other devices connected over the network._

**What?** This script is intended to be used in [ioBroker](https://www.iobroker.net/#en/intro) to connect to your Helios KWL, read its current values (temperature, fan speed, ...) and change its settings.

**Why?** The original UI ("Helios easyControls") is pretty outdated and I wanted to connect the Helios KWL to my smart home. Now I'm able to control the fan speed dynamically depending on other parameters, like the number of people in the rooms and current temperatures.

**How?** The code is documented in English. The README is in German because Helios is mostly present in Germany. If you own a Helios KWL and have questions, feel free to ask. Summary: This script loads the current values from various XML-files, refreshes the datapoints in ioBroker and sends its own values to change settings.
