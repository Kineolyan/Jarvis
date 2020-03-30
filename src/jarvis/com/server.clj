(ns jarvis.com.server
  (:require [net.tcp.server :as s]
            [clojure.java.io :as io])
  (:import [java.io FileNotFoundException BufferedReader BufferedWriter]))

(def port-file "/tmp/jarvis.sock")

(defn read-port
  "Reads the port of the started Jarvis application."
  []
  (try 
    (Integer/parseInt (slurp port-file))
    (catch FileNotFoundException e
      (throw (IllegalStateException. "Server not started" e)))))

(defn handler [^BufferedReader reader ^BufferedWriter writer]
  (println "new connection :)")
  ; wait for the first input
  (loop []
    (when-not (.ready reader) 
      (Thread/sleep 10)
      (recur)))
  (loop []
    (when (.ready reader)
      (println (str "> " (.readLine reader)))
      (recur)))
  (.append writer "Hello World\n")
  (.flush writer)
  (Thread/sleep 5000)
  (println "bye connection :)"))

(defn create
  "Creates a new server."
  []
  (s/tcp-server
   :port    0
   :handler (s/wrap-io handler)))

(defn start
  "Starts the given server."
  [server]
  (when (.exists (io/file port-file))
    (throw (IllegalStateException. (str "Server already started on port " (read-port)))))
  (s/start server)
  (let [^java.net.Socket socket @(:socket server)
        port (.getLocalPort socket)]
    (spit port-file port)
    (let [p (read-port)]
      (when-not (= p port)
        (throw (IllegalStateException. 
                "Stored port not matching current port. Concurrent start of app?"))))))

(defn stop
  "Stops a running server"
  [server]
  (when (s/running? server)
    (s/stop server)
    (io/delete-file port-file)))

(comment
  (def srv (create))
  (start srv)
  (s/running? srv)
  (read-port)
  
  (stop srv)
  
  (.getLocalPort @(:socket srv)))