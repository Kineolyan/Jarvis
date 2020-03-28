(ns jarvis.com.server
  (:require [net.tcp.server :as s]
            [clojure.java.io :as io]))

(defn handler [reader writer]
  (with-open [rdr (io/reader reader)]
    (doseq [line (line-seq rdr)]
      (println (str "> " line))))
  (spit writer "Hello World"))

(defn create
  "Creates a new server."
  []
  (s/tcp-server
   :port    0
   :handler (s/wrap-io handler)))

(defn start
  "Starts a given server"
  [server]
  (s/start server)
  (let [port (.getLocalPort @(:socket server))]
    (spit "/tmp/jarvis.port" port)))

(defn stop
  "Stops a running server"
  [server]
  (when (s/running? server)
    (s/stop server)))

(comment
  (def srv (create))
  (start srv)
  (stop srv)
  (s/running? srv)
  (.getLocalPort @(:socket srv)))