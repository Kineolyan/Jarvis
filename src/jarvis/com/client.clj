(ns jarvis.com.client
  (:require [clojure.java.io :as io]
            [net.tcp.server :as s]
            [jarvis.com.server :refer [read-port]])
  (:import [java.net Socket]))

(defn send-msg
  ([content]
   (send-msg  content))
  ([port content]
   (with-open [socket (Socket. "localhost" port)]
     (let [handler (s/wrap-io (fn [_reader writer]
                                (.append writer content)
                              ;; (doseq [line (line-seq reader)]
                                ;; (println (str "< " line)))
                                ))]
       (handler socket)))))

(comment
  (def content "test")
  (def port (read-port))
  
  (with-open [s (Socket. "localhost" (read-port))]
    (println (str (System/currentTimeMillis)))
    (.write (.getOutputStream s) (.getBytes "multi\nlines"))
    (Thread/sleep 100)
    (println "< reading")
    (let [in (io/reader (.getInputStream s))]
      (loop [ready (.ready in) c 0]
        (when (< c 10)
          (if ready
            (println (str "< " (.readLine in)))
            (do 
              (println "< nothing...")
              (Thread/sleep 10)
              (recur (.ready in) (inc c)))))))
    (.write (.getOutputStream s) (.getBytes "adios\n"))
    (println "-- end --")
    (println (str (System/currentTimeMillis))))
  
  (send-msg content))

